"""
Parse the old database stored in wprb.json and add the entries to our database
"""
if __name__=='__main__':
	import os, django
	os.environ['DJANGO_SETTINGS_MODULE'] = 'radio.settings'
	django.setup()

from datetime import date, datetime
import json

from playlist.models import *
from music.models import *
from music.common import get_or_create

def add_djs(djs, logins):
	""" Iterate through a list of DJ objects and add them to the database
	along with their show
	"""
	for djid, entry in djs.items():
		if not entry['defdjname']: continue
		if User.objects.filter(username=logins[entry['loginsID']]['login']).exists(): continue
		# create user object
		usr = User.objects.create_user(
			username=logins[entry['loginsID']]['login'], 
			password='default')

		# Create dj object
		print('Creating DJ %d: %s' % (int(entry['ID']), entry['defdjname']))
		dj = DJ(
			name=entry['defdjname'], 
			user=usr,
			first_name=entry['firstname'],
			last_name=entry['lastname'])

		dj.id = int(entry['ID'])
		dj.save()

		# Create "show" object
		print('Creating Show %s' % entry['deftitle'])
		show = Show(name=(entry['deftitle'] if entry['deftitle'] else entry['defgenre']))
		show.save()
		show.dj.add(dj)


def add_playlists(playlists):
	""" Iterate through a list of playlist objects (from old WPRB db) 
	and create each one in the new database
	"""

	for pid, playlist in playlists.items():
		# Get playlist and show
		try: dj = DJ.objects.get(pk=int(playlist['userID']))
		except DJ.DoesNotExist: continue 

		show = Show.objects.filter(dj=dj).first()

		genre, created = Genre.objects.get_or_create(name=playlist['genre'])

		# Create playlist object
		playlist = Playlist(
			show=show, 
			date=date.fromtimestamp(int(playlist['starttime'])),
			subtitle=playlist['subtitle'],
			genre=genre,
			timestamp=datetime.now())
		playlist.id = int(pid)

		playlist.save()

def add_spins(spins):
	""" Iterate through a list of spins and add them to the proper playlist
	"""

	for spin_id, spin in spins.items():
		_, _, song = get_or_create(spin['artist'], spin['album'], spin['song'])
		try: playlist = Playlist.objects.get(pk=int(spin['showID']))
		except Playlist.DoesNotExist: continue
		if song.name == "BREAK": continue
		index = Spin.objects.filter(playlist=playlist).count() + 1
		spin = Spin(song=song, playlist=playlist, index=index)
		spin.save()

def main(filename):

	with open(filename) as file:
		db = json.load(file)

	add_djs(db['users'], db['logins'])
	add_playlists(db['shows'])
	add_spins(db['playlist'])

if __name__=="__main__":
	import sys
	main(sys.argv[1])