"""
A location for helper functions.
"""
from django.http import JsonResponse

def error(message):
	return JsonResponse({'error': message})

def success():
	return JsonResponse({'success': True})

def invalid_array_index(array, index):
	if (index < 0) or (index > len(array)):
		return True
	return False

def spinDict(spin):
	return {
		"id": spin.id,
		"index": spin.index,
		"title": spin.song.name,
		"artist": spin.song.artist.name,
		"album": spin.song.album.name,
		"label": spin.song.album.label
	}