from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from pydantic import BaseModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NETEASE_API = "https://music.163.com/api"
CLOUD_MUSIC_API = "https://autumnfish.cn"


@app.get("/api/music/search")
async def music_search(keywords: str = Query(...), limit: int = 20, type: int = 1):
    try:
        async with httpx.AsyncClient() as client:
            params = {"s": keywords, "limit": limit, "type": type, "offset": 0}
            r = await client.get(f"{CLOUD_MUSIC_API}/search", params=params, timeout=10)
            data = r.json()
            if data.get("result"):
                songs = data["result"].get("songs", [])
                result = []
                for song in songs:
                    result.append({
                        "id": song.get("id"),
                        "name": song.get("name"),
                        "artist": "/".join([a.get("name") for a in song.get("artists", [])]),
                        "album": song.get("album", {}).get("name"),
                        "cover": song.get("album", {}).get("picUrl", ""),
                        "duration": song.get("duration", 0),
                    })
                return {"songs": result}
            return {"songs": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/url")
async def music_url(id: int = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/song/url", params={"id": id}, timeout=10)
            data = r.json()
            urls = data.get("data", [])
            if urls:
                return {"url": urls[0].get("url")}
            return {"url": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/lyrics")
async def music_lyrics(id: int = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/lyric", params={"id": id}, timeout=10)
            data = r.json()
            if data.get("lrc"):
                return {"lyrics": data["lrc"].get("lyric", "")}
            return {"lyrics": ""}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/playlist")
async def music_playlist(id: int = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/playlist/detail", params={"id": id}, timeout=10)
            data = r.json()
            if data.get("result"):
                tracks = data["result"].get("tracks", [])
                result = []
                for song in tracks[:50]:
                    result.append({
                        "id": song.get("id"),
                        "name": song.get("name"),
                        "artist": "/".join([a.get("name") for a in song.get("artists", [])]),
                        "album": song.get("album", {}).get("name"),
                        "cover": song.get("album", {}).get("picUrl", ""),
                        "duration": song.get("duration", 0),
                    })
                return {"tracks": result}
            return {"tracks": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/mv")
async def music_mv(id: int = Query(...)):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/mv/url", params={"id": id}, timeout=10)
            data = r.json()
            return {"url": data.get("data", {}).get("url")}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/toplist")
async def music_toplist():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/toplist/detail", timeout=10)
            data = r.json()
            if data.get("list"):
                result = []
                for lst in data["list"][:10]:
                    result.append({
                        "id": lst.get("id"),
                        "name": lst.get("name"),
                        "cover": lst.get("coverImgUrl", ""),
                        "playCount": lst.get("playCount", 0),
                        "description": lst.get("description", ""),
                    })
                return {"lists": result}
            return {"lists": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/music/recommend")
async def music_recommend():
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"{CLOUD_MUSIC_API}/personalized", timeout=10)
            data = r.json()
            if data.get("result"):
                result = []
                for item in data["result"][:10]:
                    result.append({
                        "id": item.get("id"),
                        "name": item.get("name"),
                        "cover": item.get("picUrl", ""),
                        "playCount": item.get("playCount", 0),
                    })
                return {"playlists": result}
            return {"playlists": []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
