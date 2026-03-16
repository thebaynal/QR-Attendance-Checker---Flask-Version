# Empty reportlab_mods.py
# Prevents reportlab from attempting to load ~/.reportlab_mods via _fake_import,
# which can raise an uncaught SyntaxError if that file exists with invalid content.
