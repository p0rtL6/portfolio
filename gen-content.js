const fs = require("fs");
const cheerio = require("cheerio");

const directories = ["art", "photography"];

directories.forEach((directory) => {
  const data = fs.readFileSync(`./${directory}/index.html`);
  const $ = cheerio.load(data);

  $flexContainer = $("#flex-container");

  $flexContainer.empty();

  const topLevelPaths = fs.readdirSync(`./${directory}/content`);
  topLevelPaths.forEach((topLevelPath, topLevelPathIndex) => {
    const stats = fs.statSync(`./${directory}/content/${topLevelPath}`);

    if (stats.isDirectory()) {
      $galleryItem = $(`<div class="gallery-carousel"></div>`);
      $galleryItem.append(
        $(
          `<button disabled class="prev disabled" onclick="carousel('prev', ${topLevelPathIndex})"><img src="../icons/prev.svg"/></button>`
        )
      );

      $images = $('<div class="images"></div>');

      const subDirPaths = fs.readdirSync(
        `./${directory}/content/${topLevelPath}`
      );
      subDirPaths.forEach((subDirPath, subDirPathIndex) => {
        $image = $(
          `<img src="content/${topLevelPath}/${subDirPath}" loading="lazy" onclick="window.location.href = '/${directory}/content/${topLevelPath}/${subDirPath}'"/>`
        );
        if (subDirPathIndex === 0) {
          $image.attr("class", "visible");
        } else {
          $image.attr("class", "hidden");
        }
        $images.append($image);
      });

      $galleryItem.append($images);
      $galleryItem.append(
        $(
          `<button class="next" onclick="carousel('next', ${topLevelPathIndex})"><img src="../icons/next.svg"/></button>`
        )
      );

      $flexContainer.append($galleryItem);
    } else {
      $flexContainer.append(
        $(
          `<div class="gallery-image"><img src="content/${topLevelPath}" loading="lazy" onclick="window.location.href = '/${directory}/content/${topLevelPath}'"/></div>`
        )
      );
    }
  });

  fs.writeFileSync("./" + directory + "/index.html", $.html(), (_) => {});
});
