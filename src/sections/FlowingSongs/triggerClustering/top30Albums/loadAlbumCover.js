export function loadAlbumCover(){
  const photos = import.meta.glob("../../../../assets/album_cover/*.{jpg,jfif,png}", { eager: true });
  const PhotosJson = {};

  Object.keys(photos).forEach(path => {
    const name = path.split("/").pop().replace(/\.(jpg|jfif|png)$/, "");
    PhotosJson[name] = photos[path].default;
  });

  return PhotosJson;
}
