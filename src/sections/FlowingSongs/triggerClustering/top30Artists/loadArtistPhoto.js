export function loadArtistPhoto(){
  const photos = import.meta.glob("../../../../assets/artistsPhoto/*.{jpg,jfif}", { eager: true });
  const PhotosJson = {};

  Object.keys(photos).forEach(path => {
    const name = path.split("/").pop().replace(/\.(jpg|jfif)$/, "");
    PhotosJson[name] = photos[path].default;
  });

  PhotosJson["Scott Bradlee's Postmodern Jukebox"] = "/src/assets/artistsPhoto/Scott%20Bradlee%27s%20Postmodern%20Jukebox.jpg";
  return PhotosJson;
}


