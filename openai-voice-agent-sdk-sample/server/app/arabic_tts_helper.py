"""
Arabic TTS Number Preprocessing
Fixes issue where TTS mispronounces numbers, especially currency amounts
Enhanced for gpt-4o-mini-tts model with instruction support
"""

import re
from typing import Dict

def get_arabic_tts_instructions() -> str:
    """
    Get TTS instructions optimized for gpt-4o-mini-tts model
    These instructions help improve Arabic pronunciation
    """
    return """تحدث بوضوح باللغة العربية. 
اهتم بنطق الأرقام والعملات بشكل صحيح. 
استخدم نبرة ودودة ومهنية مناسبة للمدرسة.
اجعل الكلام طبيعي وسهل الفهم."""

def number_to_arabic_words(num: int) -> str:
    """Convert numbers to Arabic words for better TTS pronunciation"""
    
    ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"]
    tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"]
    hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"]
    
    if num == 0:
        return "صفر"
    
    if num < 0:
        return "سالب " + number_to_arabic_words(-num)
    
    if num < 10:
        return ones[num]
    
    if num == 10:
        return "عشرة"
    
    if num == 11:
        return "أحد عشر"
    
    if num == 12:
        return "اثنا عشر"
    
    if num < 20:
        return ones[num - 10] + " عشر"
    
    if num < 100:
        tens_digit = num // 10
        ones_digit = num % 10
        result = tens[tens_digit]
        if ones_digit > 0:
            result += " و" + ones[ones_digit]
        return result
    
    if num < 1000:
        hundreds_digit = num // 100
        remainder = num % 100
        result = hundreds[hundreds_digit]
        if remainder > 0:
            result += " و" + number_to_arabic_words(remainder)
        return result
    
    if num < 1000000:
        thousands = num // 1000
        remainder = num % 1000
        result = number_to_arabic_words(thousands) + " ألف"
        if remainder > 0:
            result += " و" + number_to_arabic_words(remainder)
        return result
    
    # For larger numbers, just return the number as string
    return str(num)

def preprocess_text_for_arabic_tts(text: str) -> str:
    """
    Preprocess text to improve Arabic TTS pronunciation of numbers
    """
    
    # Handle currency amounts with common patterns
    currency_patterns = [
        (r'(\d+)\s*دينار', lambda m: f"{number_to_arabic_words(int(m.group(1)))} دينار"),
        (r'(\d+)\s*ريال', lambda m: f"{number_to_arabic_words(int(m.group(1)))} ريال"),
        (r'(\d+)\s*درهم', lambda m: f"{number_to_arabic_words(int(m.group(1)))} درهم"),
    ]
    
    # Handle standalone numbers that are likely currency amounts
    def replace_currency_number(match):
        num = int(match.group(1))
        # If it's a typical school fee amount (1000-50000), add currency context
        if 1000 <= num <= 50000:
            return f"{number_to_arabic_words(num)} دينار"
        else:
            return number_to_arabic_words(num)
    
    # Replace standalone numbers that look like currency
    text = re.sub(r'\b(\d{4,5})\b', replace_currency_number, text)
    
    # Apply currency patterns
    for pattern, replacement in currency_patterns:
        text = re.sub(pattern, replacement, text)
    
    # Handle other standalone numbers
    def replace_number(match):
        num = int(match.group(1))
        return number_to_arabic_words(num)
    
    # Replace remaining numbers (but be careful not to replace years or IDs)
    text = re.sub(r'\b(\d{1,3})\b', replace_number, text)
    
    # Clean up multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def format_school_fees_text(text: str) -> str:
    """
    Specifically format school fees text for better TTS
    """
    
    # Common school fee amounts and their proper pronunciation
    fee_replacements = {
        "1800": "ألف وثمانمائة دينار",
        "17100": "سبعة عشر ألف ومائة دينار", 
        "14000": "أربعة عشر ألف دينار",
        "13300": "ثلاثة عشر ألف وثلاثمائة دينار",
        "11900": "أحد عشر ألف وتسعمائة دينار",
        "11200": "أحد عشر ألف ومائتا دينار",
    }
    
    for number, replacement in fee_replacements.items():
        text = text.replace(number, replacement)
    
    return text
