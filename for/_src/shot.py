import sys, threading, functools, http.server, socketserver
from playwright.sync_api import sync_playwright
import pathlib
ROOT=str(pathlib.Path(__file__).resolve().parents[2])
H=functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
class S(socketserver.ThreadingTCPServer): allow_reuse_address=True
srv=S(("127.0.0.1",8765),H); threading.Thread(target=srv.serve_forever,daemon=True).start()
out=sys.argv[1]; slugs=sys.argv[2:]
with sync_playwright() as p:
    b=p.chromium.launch()
    for slug in slugs:
        for name,vw in (("d",{"width":1280,"height":900}),("m",{"width":390,"height":844})):
            pg=b.new_page(viewport=vw, device_scale_factor=1)
            errs=[]
            pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
            pg.on("pageerror", lambda e: errs.append(str(e)))
            pg.goto(f"http://127.0.0.1:8765/for/{slug}/", wait_until="networkidle")
            pg.wait_for_timeout(1200)
            sw=pg.evaluate("document.documentElement.scrollWidth"); 
            pg.screenshot(path=f"{out}/{slug}-{name}.png", full_page=True)
            print(slug,name,"scrollWidth",sw,"errors",errs)
            pg.close()
    b.close()
srv.shutdown()
