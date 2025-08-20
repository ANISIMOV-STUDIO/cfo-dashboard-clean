#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8081

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    web_dir = os.path.dirname(os.path.realpath(__file__))
    os.chdir(web_dir)
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        print(f"Open http://localhost:{PORT}/cfo-dashboard.html")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")