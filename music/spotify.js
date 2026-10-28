const play = require('@iamtraction/play-dl');

// Spotify no permite transmitir audio a un bot externo, así que leemos
// nombre/artista del link de Spotify y buscamos esa canción en YouTube.
//
// Requiere haber corrido una vez:
//   node -e "require('@iamtraction/play-dl').authorization()"
// para generar .data/spotify.data

// Busca en YouTube el equivalente de una canción de Spotify
async function spotifyTrackToYoutube(track) {
  const artistas = track.artists.map(a => a.name).join(' ');
  const searchQuery = `${track.name} ${artistas}`;
  const results = await play.search(searchQuery, { limit: 1, source: { youtube: 'video' } });
  if (!results || results.length === 0) return null;
  return { url: results[0].url, title: `${track.name} - ${artistas}` };
}

// play-dl espera las canciones en "tracks", pero Spotify ahora las devuelve
// paginadas en "items" (100 por página, con link "next"). Por eso hacemos la
// petición nosotros mismos para playlists.
async function fetchSpotifyPlaylistTracks(playlistId, market, accessToken, tokenType) {
  const tracks = [];
  let url = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}?market=${market}`;
  let isFirstPage = true;

  while (url) {
    const res = await fetch(url, { headers: { Authorization: `${tokenType} ${accessToken}` } });
    const json = await res.json();
    if (json.error) throw new Error(`Spotify respondió ${json.error.status}: ${json.error.message}`);

    // La primera respuesta trae la página anidada en "items";
    // las siguientes (link "next") vienen al nivel raíz.
    const page = isFirstPage ? json.items : json;
    isFirstPage = false;

    for (const entry of page.items) {
      const item = entry.item;
      if (item && item.name && item.artists) {
        tracks.push({ name: item.name, artists: item.artists });
      }
    }
    url = page.next;
  }

  return tracks;
}

// Resuelve varias canciones a la vez (en lotes) para no tardar minutos en playlists grandes.
async function resolveSpotifyTracksInBatches(spotifyTracks, batchSize = 8) {
  const tracks = [];
  for (let i = 0; i < spotifyTracks.length; i += batchSize) {
    const batch = spotifyTracks.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(t => spotifyTrackToYoutube(t).catch(() => null)));
    for (const found of results) {
      if (found) tracks.push(found);
    }
  }
  return tracks;
}

module.exports = { spotifyTrackToYoutube, fetchSpotifyPlaylistTracks, resolveSpotifyTracksInBatches };
