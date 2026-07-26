import functools
import http.server
import socketserver

PORT = 8934
DIRECTORY = "/Users/jackkennedy/Downloads/design_handoff_bali_list/app"

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving {DIRECTORY} at port {PORT}")
    httpd.serve_forever()
