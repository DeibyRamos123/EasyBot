const fs = require('fs').promises;
const play = require('@iamtraction/play-dl');
const {
  spotifyTrackToYoutube,
  fetchSpotifyPlaylistTracks,
  resolveSpotifyTracksInBatches,
} = require('./spotify');

// Convierte una query (link de video, link de playlist o texto de búsqueda)
// en un array de canciones { url, title }
async function resolveTracks(query) {
  const urlType = await play.validate(query);

  if (urlType.startsWith('sp_') && play.is_expired()) {
    await play.refreshToken();
  }

  if (urlType === 'yt_playlist') {
    const playlist = await play.playlist_info(query, { incomplete: true });
    const videos = await playlist.all_videos();
    return videos.map(v => ({ url: v.url, title: v.title }));
  }

  if (urlType === 'yt_video') {
    const info = await play.video_info(query);
    return [{ url: info.video_details.url, title: info.video_details.title }];
  }

  // --- Links de Spotify: se busca el equivalente de cada canción en YouTube ---
  if (urlType === 'sp_track') {
    const spotifyTrack = await play.spotify(query);
    const found = await spotifyTrackToYoutube(spotifyTrack);
    return found ? [found] : [];
  }

  if (urlType === 'sp_playlist') {
    await play.refreshToken();
    const spotifyAuth = JSON.parse(await fs.readFile('./.data/spotify.data', 'utf8'));
    const playlistId = query.split('playlist/')[1]?.split('?')[0]?.split('&')[0];

    let spotifyTracks;
    try {
      spotifyTracks = await fetchSpotifyPlaylistTracks(playlistId, spotifyAuth.market, spotifyAuth.access_token, spotifyAuth.token_type);
    } catch (err) {
      console.error('Error obteniendo la playlist de Spotify:', err.message);
      throw new Error('No se pudo leer esa playlist de Spotify. Si es una playlist algorítmica (Discover Weekly, Daily Mix, Release Radar) no se puede leer así; prueba con una playlist normal creada por un usuario.');
    }

    return resolveSpotifyTracksInBatches(spotifyTracks);
  }

  if (urlType === 'sp_album') {
    let spotifyData;
    try {
      spotifyData = await play.spotify(query);
    } catch (err) {
      console.error('Error obteniendo datos de Spotify:', err.message);
      throw new Error('No se pudo leer ese álbum de Spotify.');
    }

    const spotifyTracks = await spotifyData.all_tracks();
    return resolveSpotifyTracksInBatches(spotifyTracks);
  }

  // Búsqueda por texto
  const searchResults = await play.search(query, { limit: 1, source: { youtube: 'video' } });
  if (!searchResults || searchResults.length === 0) return [];
  return [{ url: searchResults[0].url, title: searchResults[0].title }];
}

module.exports = { resolveTracks };
