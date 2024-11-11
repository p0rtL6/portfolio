function carousel(action, galleryIndex) {
  const gallery = document.querySelector("#flex-container");
  const galleryItem = gallery.children[galleryIndex];
  const galleryImages = galleryItem.querySelector(".images");

  let visibleIndex = -1;

  for (let i = 0; i < galleryImages.children.length; i++) {
    if (galleryImages.children[i].classList.contains("visible")) {
      visibleIndex = i;
      break;
    }
  }

  if (action === "next") {
    if (visibleIndex < galleryImages.children.length - 1) {
      galleryImages.children[visibleIndex].classList.remove("visible");
      galleryImages.children[visibleIndex].classList.add("hidden");

      visibleIndex++;

      galleryImages.children[visibleIndex].classList.remove("hidden");
      galleryImages.children[visibleIndex].classList.add("visible");
    }
  }

  if (action === "prev") {
    if (visibleIndex > 0) {
      galleryImages.children[visibleIndex].classList.remove("visible");
      galleryImages.children[visibleIndex].classList.add("hidden");

      visibleIndex--;

      galleryImages.children[visibleIndex].classList.remove("hidden");
      galleryImages.children[visibleIndex].classList.add("visible");
    }
  }

  if (visibleIndex === galleryImages.children.length - 1) {
    const button = galleryItem.querySelector(".next");
    button.disabled = true;
    button.classList.add("disabled");
  } else {
    const button = galleryItem.querySelector(".next");
    button.disabled = false;
    button.classList.remove("disabled");
  }

  if (visibleIndex === 0) {
    const button = galleryItem.querySelector(".prev");
    button.disabled = true;
    button.classList.add("disabled");
  } else {
    const button = galleryItem.querySelector(".prev");
    button.disabled = false;
    button.classList.remove("disabled");
  }
}
