import re
from django.core.exceptions import ValidationError

def normalize_phone(value):
    digits = re.sub(r'\D', '', value or '')
    if not 10 <= len(digits) <= 15:
        raise ValidationError('Enter a valid phone number with 10 to 15 digits.')
    return f'+{digits}'

def validate_strong_password(value):
    rules = [
        (r'[a-z]', 'Password must include a lowercase letter.'),
        (r'[A-Z]', 'Password must include an uppercase letter.'),
        (r'\d', 'Password must include a number.'),
        (r'[^A-Za-z0-9]', 'Password must include a special character.'),
    ]
    errors = [message for pattern, message in rules if not re.search(pattern, value or '')]
    if errors:
        raise ValidationError(errors)

