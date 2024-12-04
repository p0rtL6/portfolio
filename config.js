activeItemName = null;

function setActiveItem(item) {
  if (activeItemName) {
    const oldActiveElement = document.getElementById(activeItemName);
    oldActiveElement.style.filter = "brightness(1)";
  }

  if (!activeItemName || (activeItemName && activeItemName !== item.id)) {
    activeItemName = item.id;
    item.style.filter = "brightness(2)";
  } else {
    activeItemName = null;
  }
}

function moveItem(key) {
  activeElement = document.getElementById(activeItemName);

  switch (key) {
    case "ArrowLeft":
      break;
    case "ArrowRight":
      break;
  }
}

document.addEventListener("keydown", function (event) {
  if (!activeItemName) {
    return;
  }

  let action = null;

  if (event.key === "ArrowLeft") {
    action = "back";
    activeElement = document.getElementById(activeItemName);
    const previousSibling = activeElement.previousElementSibling;
    if (previousSibling) {
      activeElement.parentNode.insertBefore(activeElement, previousSibling);
    }
  }

  if (event.key === "ArrowRight") {
    action = "forward";
    activeElement = document.getElementById(activeItemName);
    const nextSibling = activeElement.nextElementSibling;
    if (nextSibling) {
      activeElement.parentNode.insertBefore(nextSibling, activeElement);
    }
  }

  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    fetch("http://localhost:3000/config-api/move-item", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: action,
        itemName: activeItemName,
        dir: window.location.href.replace(/\/+$/, "").split("/").pop(),
      }),
    });
  }
});

function savePage(event, element) {
  event.preventDefault();

  const flexContainer = document.getElementById("flex-container");
  const itemNames = Array.from(flexContainer.children).map((child) => child.id);

  fetch("http://localhost:3000/config-api/save-page", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dir: window.location.href.replace(/\/+$/, "").split("/").pop(),
      itemNames: itemNames,
    }),
  }).then((_) => {
    window.location.href = element.href;
  });
}
