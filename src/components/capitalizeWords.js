export function capitalizeWords(str) {
  return str
    .split(/[\s-]/)                       // 空格或连字符都分开
    .map(word => word[0].toUpperCase() + word.slice(1))
    .join(" ");                            // 也可以用 join("-") 保留连字符
}
