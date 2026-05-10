export function loadArtistPhoto(){
  const photos = import.meta.glob("../../../../assets/artistsPhoto/*.{jpg,jfif}", { eager: true });
  const PhotosJson = {};

  Object.keys(photos).forEach(path => {
    const name = path.split("/").pop().replace(/\.(jpg|jfif)$/, "");
    PhotosJson[name] = photos[path].default;
  });

  console.log(PhotosJson);
  // PhotosJson["Scott Bradlee's Postmodern Jukebox"] = "/src/assets/artistsPhoto/scott-bradlees-postmodern-jukebox.jpg";
  return PhotosJson;
}


