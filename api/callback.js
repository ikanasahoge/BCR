export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing code');
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI;

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.redirect(`/?error=${data.error}`);
    }

    // Pass token back to frontend via URL fragment
    const params = new URLSearchParams({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });

    res.redirect(`/?${params.toString()}`);
  } catch (e) {
    res.redirect('/?error=server_error');
  }
}
