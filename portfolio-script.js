require("yargs")
  .scriptName("portfolio-script")
  .usage("$0 <cmd> [args]")
  .command(
    "generate [options]",
    "generate content from files",
    (yargs) => {
      yargs.option("c", {
        alias: "config",
        type: "string",
        describe: "sort images by config file (path)",
      });
      yargs.option("s", {
        alias: "sort-by",
        type: "string",
        choices: ["name", "date"],
        describe: "sort images by file attribute",
      });
      yargs.option("d", {
        alias: "directories",
        default: ["art", "photography"],
        type: "array",
        describe: "directories to create pages from",
      });
      yargs.option("b", {
        alias: "base-url",
        default: "portfolio",
        type: "string",
        describe: "base url prefix",
      });
    },
    (argv) => {
      generate(argv.d, processBaseUrl(argv.b), argv.c, argv.s);
    }
  )
  .command(
    "configure [options]",
    "configure image order (saves to file)",
    (yargs) => {
      yargs.option("g", {
        alias: "generate",
        type: "boolean",
        default: false,
        describe: "run generate command when finished",
      });
      yargs.option("p", {
        alias: "pregenerate",
        type: "boolean",
        default: false,
        describe: "run generate command before configuring",
      });
      yargs.option("o", {
        alias: "output-path",
        default: "config.json",
        type: "string",
        describe: "the output path of the config file",
      });
      yargs.option("d", {
        alias: "directories",
        default: ["art", "photography"],
        type: "array",
        describe: "directories to create pages from",
      });
      yargs.option("b", {
        alias: "base-url",
        default: "portfolio",
        type: "string",
        describe: "base url prefix (used if generate flag is set)",
      });
    },
    (argv) => {
      configure(argv.d, argv.o, processBaseUrl(argv.b), argv.g, argv.p);
    }
  )
  .command(
    "preview [options]",
    "host a local preview of the generated website",
    (yargs) => {
      yargs.option("b", {
        alias: "base-url",
        default: "portfolio",
        type: "string",
        describe: "base url prefix",
      });
    },
    (argv) => {
      preview(processBaseUrl(argv.b));
    }
  )
  .help().argv;

function processBaseUrl(baseUrl) {
  if (baseUrl !== "") {
    return "/" + baseUrl
  } else {
    return baseUrl
  }
}

function generate(directories, baseUrl, configPath = null, sortBy = "name") {
  const cheerio = require("cheerio");
  const path = require("path");
  const fs = require("fs");

  directories.forEach((directory) => {
    if (!fs.existsSync(directory)) {
      throw Error(`${directory} does not exist.`);
    }
  });

  console.log("loading home page template...");
  let homeTemplateData = fs.readFileSync("home-template.html");
  const $ = cheerio.load(homeTemplateData);

  console.log("creating redirect...");
  $("head")
    .find('meta[http-equiv="refresh"]')
    .each((i, element) => {
      $(element).attr("content", `0;url=${baseUrl}/${directories[0]}`);
    });

  console.log("creating navbar entries...");
  $navbar = $(".navbar");

  directories.forEach((directory) => {
    $navbar.append(
      $(
        `<a href=${baseUrl}/${directory}>${directory
          .charAt(0)
          .toUpperCase()}${directory.slice(1)}</a>`
      )
    );
  });

  console.log("saving home page...");
  fs.writeFileSync("index.html", $.html(), (_) => {});

  let config = null;
  if (configPath) {
    if (fs.existsSync(configPath)) {
      console.log("loading config...");
      config = JSON.parse(fs.readFileSync(configPath));
    } else {
      throw Error("Config path does not exist.");
    }
  }

  console.log("loading page template...");
  const pageTemplateData = fs.readFileSync("page-template.html");

  directories.forEach((directory) => {
    console.log(`working on directory ${directory}...`);

    console.log("getting item names...");
    let itemNames = null;
    if (config && directory in config) {
      itemNames = config[directory];
    } else {
      itemNames = fs.readdirSync(path.join(directory, "content"));
      switch (sortBy) {
        case "name":
          console.log("sorting items by name...");
          itemNames = itemNames.sort();
          break;
        case "date":
          console.log("sorting items by date...");
          itemNames = itemNames
            .map((file) => {
              const stats = fs.statSync(path.join(directory, "content", file));
              return { file, mtime: stats.mtime };
            })
            .sort((a, b) => b.mtime - a.mtime)
            .map((item) => item.file);
          break;
      }
    }

    const $ = cheerio.load(pageTemplateData);

    console.log("setting title...");
    $("title").text(
      `${directory.charAt(0).toUpperCase()}${directory.slice(1)}`
    );

    console.log("creating navbar entries...");
    $navbar = $(".navbar");
    directories.forEach((navbarDirectory) => {
      $navbarEntry = $(
        `<a href=${baseUrl}/${navbarDirectory}>${navbarDirectory
          .charAt(0)
          .toUpperCase()}${navbarDirectory.slice(1)}</a>`
      );
      if (navbarDirectory === directory) {
        $navbarEntry.attr("class", "active");
      }
      $navbar.append($navbarEntry);
    });

    console.log("creating item entries...");
    $flexContainer = $("#flex-container");
    itemNames.forEach((itemName, itemIndex) => {
      const stats = fs.statSync(`./${directory}/content/${itemName}`);

      if (stats.isDirectory()) {
        console.log("creating carousel...");
        $galleryItem = $(
          `<div class="gallery-carousel" id="${itemName}"></div>`
        );
        $galleryItem.append(
          $(
            `<button disabled class="prev disabled" onclick="carousel('prev', ${itemIndex})"><img src="../icons/prev.svg"/></button>`
          )
        );

        $images = $('<div class="images"></div>');

        const subDirPaths = fs.readdirSync(
          `./${directory}/content/${itemName}`
        );
        subDirPaths.forEach((subDirPath, subDirPathIndex) => {
          $image = $(
            `<img src="content/${itemName}/${subDirPath}" loading="lazy" onclick="window.location.href = '${baseUrl}/${directory}/content/${itemName}/${subDirPath}'"/>`
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
            `<button class="next" onclick="carousel('next', ${itemIndex})"><img src="../icons/next.svg"/></button>`
          )
        );

        $flexContainer.append($galleryItem);
      } else {
        console.log("creating image...");
        $flexContainer.append(
          $(
            `<div class="gallery-image" id="${itemName}"><img src="content/${itemName}" loading="lazy" onclick="window.location.href = '${baseUrl}/${directory}/content/${itemName}'"/></div>`
          )
        );
      }
    });

    console.log("writing page...");
    fs.writeFileSync("./" + directory + "/index.html", $.html(), (_) => {});
  });

  console.log("done!");
}

function configure(
  directories,
  outputPath,
  baseUrl,
  generateWhenDone,
  pregenerate
) {
  const express = require("express");
  const cheerio = require("cheerio");
  const path = require("path");
  const cors = require("cors");
  const fs = require("fs");

  if (pregenerate) {
    console.log("pregenerating pages...");
    generate(directories, baseUrl);
  }

  try {
    console.log("removing existing config folder...");
    fs.rmSync("config", { recursive: true, force: true });
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("config folder does not exist, skipping removal...");
    } else {
      throw err;
    }
  }

  console.log(`making config folder...`);
  fs.mkdirSync("config");

  console.log(`copying index.html file...`);
  fs.copyFileSync("index.html", path.join("config", "index.html"));

  console.log("loading index.html file...");
  const index_data = fs.readFileSync("index.html");
  const $ = cheerio.load(index_data);

  console.log("updating redirect...");
  $("head")
    .find('meta[http-equiv="refresh"]')
    .each((i, element) => {
      const lastDir = $(element)
        .attr("content")
        .replace(/\/+$/, "")
        .split("/")
        .pop();
      console.log(lastDir);
      $(element).attr("content", `0;url=/config/${lastDir}`);
    });

  console.log("saving home page...");
  fs.writeFileSync(path.join("config", "index.html"), $.html(), (_) => {});

  console.log("creating config...");
  const config = {};
  directories.forEach((directory) => {
    config[directory] = [];
  });

  directories.forEach((dir) => {
    console.log(`making ${dir} folder...`);
    fs.mkdirSync(path.join("config", dir));

    console.log("copying index.html file...");
    fs.copyFileSync(
      path.join(dir, "index.html"),
      path.join("config", dir, "index.html")
    );

    console.log("loading index.html file...");
    const data = fs.readFileSync(path.join("config", dir, "index.html"));
    const $ = cheerio.load(data);

    console.log("updating paths...");
    $("head")
      .find('link[rel="stylesheet"]')
      .each((i, element) => {
        const stylesheetHref = $(element).attr("href");
        $(element).attr("href", `../${stylesheetHref}`);
      });

    $("head")
      .find("script")
      .each((i, element) => {
        const scriptSrc = $(element).attr("src");
        $(element).attr("src", `../${scriptSrc}`);
      });

    $("body")
      .find("img")
      .each((i, element) => {
        const imgSrc = $(element).attr("src");
        if (imgSrc.startsWith("content")) {
          $(element).attr("src", `../../${dir}/${imgSrc}`);
        } else {
          $(element).attr("src", `../${imgSrc}`);
        }
        $(element).attr("onclick", "");
      });

    $("header")
      .find("a")
      .each((i, element) => {
        const linkHref = $(element).attr("href");
        $(element).attr("href", `/config${linkHref.slice(10)}`);
        $(element).attr("onclick", "savePage(event, this)");
      });

    if (dir) {
      console.log("appending config script...");
      $("head").append('<script src="../../config.js"></script>');
    }

    console.log("updating and adding items to config...");
    $flexContainer = $("#flex-container");
    $flexContainer.children().each((i, galleryItem) => {
      const itemName = $(galleryItem).attr("id");
      $(galleryItem).css("cursor", "pointer");
      $(galleryItem).attr("onclick", `setActiveItem(this)`);
      if (dir) {
        config[dir].push(itemName);
      }
    });

    console.log("writing updated index.html...");
    fs.writeFileSync(
      path.join("config", dir, "index.html"),
      $.html(),
      (_) => {}
    );
  });

  function moveItem(dir, itemName, action) {
    configList = config[dir];
    const index = configList.indexOf(itemName);

    if (index === -1) {
      throw Error("Item name not found.");
    }

    let newIndex = index;

    if (action === "back") {
      newIndex -= 1;
    } else if (action === "forward") {
      newIndex += 1;
    } else {
      throw Error("Invalid action, must be back or forward.");
    }

    if (newIndex >= 0 && newIndex < configList.length) {
      [configList[index], configList[newIndex]] = [
        configList[newIndex],
        configList[index],
      ];
    }
  }

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static(__dirname));

  app.post("/config-api/move-item", (req, res) => {
    const requestBody = req.body;
    console.log(`moving ${requestBody.itemName} ${requestBody.action}`);
    moveItem(requestBody.dir, requestBody.itemName, requestBody.action);
    res.status(200).send("OK");
  });

  app.post("/config-api/save-page", (req, res) => {
    const requestBody = req.body;
    console.log("saving page...");

    const pageData = fs.readFileSync(
      path.join("config", requestBody.dir, "index.html")
    );
    const $ = cheerio.load(pageData);

    $flexContainer = $("#flex-container");
    $newFlexContainer = $flexContainer.clone();
    $newFlexContainer.empty();

    requestBody.itemNames.forEach((itemName) => {
      $item = $(`#${itemName.replace(/\./g, "\\.")}`);
      $newFlexContainer.append($item);
    });

    $flexContainer.replaceWith($newFlexContainer);

    fs.writeFileSync(
      path.join("config", requestBody.dir, "index.html"),
      $.html(),
      (_) => {}
    );

    res.status(200).send("OK");
  });

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Config server running on http://localhost:${PORT}`);
    console.log("Press ctrl+c anytime to exit (changes will be saved)");
    (async () => {
      const { default: open } = await import("open");
      open(`http://localhost:${PORT}/config`);
    })();
  });

  function cleanup() {
    console.log("");
    console.log("Writing config...");
    fs.writeFileSync(outputPath, JSON.stringify(config));

    console.log("removing config dir...");
    fs.rmSync("config", { recursive: true, force: true });

    if (generateWhenDone) {
      generate(directories, baseUrl, outputPath);
    } else {
      console.log("done!");
    }

    process.exit();
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

function preview(baseUrl) {
  const express = require("express");

  const app = express();
  app.use(`${baseUrl}`, express.static(__dirname));

  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Preview server running on http://localhost:${PORT}`);
    console.log("Press ctrl+c anytime to exit");
    (async () => {
      const { default: open } = await import("open");
      open(`http://localhost:${PORT}${baseUrl}`);
    })();
  });
}
