"""Check an outreach email for Juan Pablo's style rules. Usage: python check_email.py email.txt
Fails on em or en dashes, semicolons, colons, double quotes, and stock AI phrasing. Also warns over 130 words."""
import re, sys
t = open(sys.argv[1], encoding="utf-8").read()
bad = [c for c in ["—", "–", ";", ":", '"', "“", "”"] if c in t]
phr = [p for p in ["I hope this", "excited", "passionate", "thrilled", "delve", "leverage", "synergy", "game-changer",
        "I came across", "I am writing to", "I'm writing to", "cutting-edge", "seamless", "robust", "align with your",
        "would love to", "I'd love to", "dynamic team", "fast-paced"] if p.lower() in t.lower()]
words = len(re.findall(r"\S+", t))
print("words", words)
if bad or phr:
    print("FAIL punctuation", bad, "phrases", phr); sys.exit(1)
if words > 130: print("WARN long")
print("OK")
