from django import template
from django.utils.safestring import mark_safe
import bleach
import json as jsonlib

register = template.Library()

@register.filter
def json(value):
    """safe jsonify filter, bleaches the json string using the bleach html tag remover"""
    uncleaned = jsonlib.dumps(value)
    clean = bleach.clean(uncleaned)
    # Small replacements
    clean = clean.replace('&amp;', '&')
    clean = clean.replace('&lt;', '<')
    return mark_safe(clean)

@register.filter
def style(value):
	return value.split('-')[0]