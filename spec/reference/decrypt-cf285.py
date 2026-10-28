# One-time: make a pdf-lib-friendly copy of the official CF 285.
# The official file is RC4-encrypted with an EMPTY user password; its permissions allow form fill.
# pip install pypdf ; python3 decrypt-cf285.py forms/CF285.pdf forms/CF285_unlocked.pdf
import sys
from pypdf import PdfReader, PdfWriter
r = PdfReader(sys.argv[1])
if r.is_encrypted:
    r.decrypt("")
w = PdfWriter(clone_from=r)
w.write(sys.argv[2])
print("fields:", len(r.get_fields() or {}))
