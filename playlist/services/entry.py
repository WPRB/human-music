#!/usr/bin/env python
""" entry.py - Implements basic services for editing entry in a playlist. """

from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from django.http import QueryDict, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from ..models import Spin, Playlist
from ..common import invalid_array_index, error, success, spinDict
from music.models import Song, Artist, Album, Label, Genre, Subgenre
from music.common import get_or_create

import json

#@login_required
@csrf_exempt 
@require_http_methods(["POST"])
def add(request, playlist_id):
	""" Adds the song specified by the provided title, artist,
		album, and label to the playlist specified by the playlist_id 
		at the position specified by index. 
	"""
	try:
		playlist    = Playlist.objects.get(pk=playlist_id)
		spins       = Spin.objects.filter(playlist__pk=playlist_id)
		song_title  = request.POST['title']
		artist_name = request.POST['artist']
		album_name  = request.POST['album']
		label_name  = request.POST['label']
		spin_index  = spins.count() + 1
	except Playlist.DoesNotExist:
		return error('Invalid URI')
	except (KeyError, ValueError):
		return error('Invalid request')

	# Get the artist, album, and song objects, creating each if necessary
	artist, album, song = get_or_create(artist_name, album_name, song_title)

	# Add the medium if it's provided
	new_spin = Spin(song=song, index=spin_index, playlist=playlist)
	if 'medium' in request.POST:
		new_spin.medium = request.POST['medium']

	new_spin.save()

	# Update the playcounts on all our objects
	song.playcount += 1
	artist.playcount += 1
	album.playcount += 1

	# Finally, shift the playlist if need be
	# spins_to_update = spins.filter(index__gte=spin_index)
	# for spin in spins_to_update:
	# 	spin.index = spin.index + 1
	# 	spin.save()

	# Hacky, forgive me
	response = {
		"success": True,
		"spin": spinDict(new_spin)
	}
	if label_name is not None:
		response['spin']['label'] = label_name
	else:
		response['spin']['label'] = ''

	print("Returning add response...")
	print(response)
	return JsonResponse(response)

@require_http_methods(["GET"])
def get_playlist_spins(request, playlist_id):
	''' A helper method. Does what it says. 
	'''
	try:
		playlist = Playlist.objects.get(pk=playlist_id)
		spins    = Spin.objects.filter(playlist__pk=playlist_id)
	except Playlist.DoesNotExist:
		return error('Invalid URI')

	# Hacky, to get around serialization issues
	list_of_spin_dicts = []
	for spin in spins:
		list_of_spin_dicts.append({
			'index':spin.index,
			'title':spin.song.name,
			'artist':spin.artist.name,
			'album':spin.album.name,
			})
	return to_return

#@login_required
@require_http_methods(["PUT"])
def move(request, playlist_id):
	""" Moves the spin specified by the given 'spin_pk' to the index
		specified by 'index'. 
	"""
	try:
		args         = json.loads(request.body)
		spins        = Spin.objects.filter(playlist__pk=playlist_id)
		target_spin  = spins.get(pk=args['spinId'])
		old_index    = target_spin.index
		new_index    = int(args['index'])
	except (KeyError, ValueError):
		return error('Invalid request')
	except Spin.DoesNotExist:
		return error('No matching spin')

	if invalid_array_index(spins, old_index):
		return error('Check with your db admin')
	if invalid_array_index(spins, new_index):
		return error('Invalid index')

	# Two sets to update depending on if spin was moved up or down
	spins_to_decrement = spins.filter(index__gt=old_index, index__lte=new_index)
	spins_to_increment = spins.filter(index__lt=old_index, index__gte=new_index)

	# Update target spin and save
	target_spin.index = new_index
	target_spin.save()

	# Update following spins and save
	for spin in spins_to_decrement:
		spin.index = spin.index - 1
		spin.save()

	for spin in spins_to_increment:
		spin.index = spin.index + 1
		spin.save()

	return success()

#@login_required
@csrf_exempt 
@require_http_methods(["DELETE"])
def delete(request, playlist_id):
	""" Deletes the spin specified by the given pk from the 
		playlist specified in the URI. 
	"""
	try:
		args         = json.loads(request.body)
		spins        = Spin.objects.filter(playlist__pk=playlist_id)
		target_spin  = spins.get(index=args['index'])
		index        = target_spin.index
	except KeyError:
		return error('Invalid request')
	except Spin.DoesNotExist:
		return error('No matching spin')

	if invalid_array_index(spins, index):
		print("Length is %d" %len(spins))
		print("Index is %d" %index)
		print(spins)
		return error('Invalid index')

	print("Received the following dict on delete...")
	print(args)
	print("Found the following spin...")
	print(target_spin)
	print("Proceeding to delete, and update other spins...")

	# Delete the spin from the database and update other playlist indices
	target_spin.delete()
	spins_to_update = spins.filter(index__gt=index)
	for spin in spins_to_update:
		spin.index = spin.index - 1
		spin.save()

	# Update the playcounts
	return success()

#@login_required
@csrf_exempt
@require_http_methods(["PUT"])
def update(request, playlist_id):
	""" Updates the specified entry with provided basic spin dict 
	"""
	try: 
		args         = json.loads(request.body)
		playlist     = Playlist.objects.get(pk=playlist_id)
		spins        = Spin.objects.filter(playlist__pk=playlist_id)
		target_spin  = spins.get(index=args['index'])
	except KeyError:
		return error('Invalid request')
	except Spin.DoesNotExist:
		return error('No matching spin')
	except Playlist.DoesNotExist:
		return error('No matching playlist')

	try:
		artist, album, song = get_or_create(args['artist'], args['album'], args['title'])
	except KeyError:
		return error('Invalid request')

	new_spin = Spin(song=song, index=target_spin.index, playlist=playlist)

	target_spin.delete()
	new_spin.save()

	print("Received this dict on update...")
	print(args)
	print("Returning this dict on update...")
	print(spinDict(new_spin))

	return JsonResponse({
		'success': True,
		'spin': spinDict(new_spin)
	})

@require_http_methods(["GET"])
def complete(request, playlist_id):
	""" Returns a list of songs that *match* the provided
	    title, artist, album, and label, which can all be 
		incomplete strings. 
	"""
	args = request.GET

	# Filter songs by query, case insensitively
	songs = Songs.objects.all()
	if 'title' in args:
		songs = songs.filter(name__icontains=args['title'])
	if 'artist' in args:
		songs = songs.filter(artist__name__icontains=args['artist'])
	if 'album' in args:
		songs = songs.filter(album__name__icontains=args['album'])
	if 'label' in args:
		songs = songs.filter(album__label__name__icontains=args['label'])

	matches = [
		{
			'title'	: s.name,
			'artist': s.artist.name,
			'album' : s.album.name,
			'label' : s.album.label.name if album.label else None,
		} for s in songs
	]

	return JsonResponse({ 'matches': matches })
