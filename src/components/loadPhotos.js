export function loadPhotos(folderPath){
  const photos = import.meta.glob(`${folderPath}/*.{jpg,jfif}`, { eager: true });
  const PhotosJson = {};

  Object.keys(photos).forEach(path => {
    const name = path.split("/").pop().replace(/\.(jpg|jfif)$/, "");
    PhotosJson[name] = photos[path].default;
  });

  return PhotosJson;
}


