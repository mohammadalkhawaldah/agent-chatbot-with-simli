#!/usr/bin/env python3
"""
Combined server that serves both FastAPI backend and Next.js frontend
This allows deployment as a single service on Render to save costs
"""
import os
import sys
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

# Add server directory to Python path
server_dir = Path(__file__).parent / "server"
sys.path.insert(0, str(server_dir))

# Import the existing FastAPI app components
from server import app as fastapi_app

# Create a new app that combines everything
app = FastAPI(title="Voice Agent Combined App")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the existing FastAPI app routes (but not the app itself to avoid conflicts)
# Copy routes from the original app
for route in fastapi_app.routes:
    if hasattr(route, 'path') and route.path.startswith('/'):
        # Mount API routes under /api prefix for better organization
        if route.path == '/ws':
            # Keep WebSocket at root level for compatibility
            app.routes.append(route)
        else:
            # Mount other routes under /api
            new_route = type(route)(
                route.path if route.path.startswith('/api') else f'/api{route.path}',
                endpoint=route.endpoint,
                methods=getattr(route, 'methods', None)
            )
            app.routes.append(new_route)

# Serve Next.js static files
frontend_out_dir = Path(__file__).parent / "frontend" / "out"

if frontend_out_dir.exists():
    print(f"Serving static files from: {frontend_out_dir}")
    
    # Mount static assets
    static_dirs = ["_next", "static", "images"]
    for static_dir in static_dirs:
        static_path = frontend_out_dir / static_dir
        if static_path.exists():
            app.mount(f"/{static_dir}", StaticFiles(directory=str(static_path)), name=static_dir)
    
    @app.get("/{full_path:path}")
    async def serve_frontend(request: Request, full_path: str):
        """Serve the Next.js static files"""
        # Skip API and WebSocket routes
        if full_path.startswith(("api/", "ws", "_next/", "static/")):
            return
        
        # Try to serve the exact file
        if full_path:
            file_path = frontend_out_dir / full_path
            if file_path.is_file():
                return FileResponse(str(file_path))
            
            # Try with .html extension
            html_path = frontend_out_dir / f"{full_path}.html"
            if html_path.is_file():
                return FileResponse(str(html_path))
        
        # For SPA routing, serve index.html for non-API routes
        index_path = frontend_out_dir / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        
        return {"error": "Frontend files not found"}, 404
else:
    print(f"Frontend out directory not found: {frontend_out_dir}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "message": "Combined voice agent server running",
        "frontend_available": frontend_out_dir.exists()
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
