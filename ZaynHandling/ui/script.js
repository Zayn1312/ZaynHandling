const resName = typeof GetParentResourceName == "function" ? GetParentResourceName() : "ZaynHandling";
const elements = {};
let descriptions = {};
let currentHandling = {};
let currentLanguage = "en"; // default
let vehicleList = [];


// Helper fetch function to send POST requests
async function Post(endpoint, data) {
  try {
    const resp = await fetch(`https://${resName}/${endpoint}`, {
      method: "POST",
      mode: "same-origin",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json; charset=UTF-8"
      },
      body: data ? JSON.stringify(data) : "{}"
    });
    if (!resp.ok) return;
    return await resp.json();
  } catch (error) {
    console.error("Post error:", error);
  }
}


// Populate the parameters table dynamically with descriptions based on currentLanguage
function populateTable(handling, descs) {
  descriptions = descs || {};
  currentHandling = handling || {};
  const tbody = document.getElementById("tbody_params");
  tbody.innerHTML = ""; // clear previously


  Object.keys(currentHandling).forEach((key) => {
    if (key.endsWith("_x") || key.endsWith("_y") || key.endsWith("_z")) return;


    const tr = document.createElement("tr");


    // Parameter Name
    const tdName = document.createElement("td");
    tdName.className = "param-name";
    tdName.textContent = key;
    tr.appendChild(tdName);


    // Value input(s)
    const tdValue = document.createElement("td");
    if (
      currentHandling.hasOwnProperty(key + "_x") &&
      currentHandling.hasOwnProperty(key + "_y") &&
      currentHandling.hasOwnProperty(key + "_z")
    ) {
      const div = document.createElement("div");
      ["x", "y", "z"].forEach((axis) => {
        const input = document.createElement("input");
        input.type = "number";
        input.className = "input short";
        input.id = key + `_${axis}`;
        input.value = currentHandling[key + `_${axis}`];
        input.placeholder = "0.0";
        input.addEventListener("input", onInputChange);
        elements[key + `_${axis}`] = input;
        div.appendChild(document.createTextNode(`${axis}=`));
        div.appendChild(input);
      });
      tdValue.appendChild(div);
    } else {
      const div = document.createElement("div");
      div.className = "value";
      const input = document.createElement("input");
      input.type = "number";
      input.className = "input";
      input.id = key;
      input.value = currentHandling[key];
      input.placeholder = "0.0";
      input.addEventListener("input", onInputChange);
      elements[key] = input;
      div.appendChild(input);


      const btnAdd = document.createElement("div");
      btnAdd.className = "button add";
      btnAdd.textContent = "+";
      btnAdd.onclick = () => onButtonClick("add", key);
      div.appendChild(btnAdd);


      const btnSub = document.createElement("div");
      btnSub.className = "button substract";
      btnSub.textContent = "-";
      btnSub.onclick = () => onButtonClick("substract", key);
      div.appendChild(btnSub);


      tdValue.appendChild(div);
    }
    tr.appendChild(tdValue);


    // Description based on currentLanguage
    const tdDesc = document.createElement("td");
    tdDesc.className = "param-desc";
    tdDesc.textContent = (descriptions[key] && descriptions[key][currentLanguage]) || "-";
    tr.appendChild(tdDesc);


    tbody.appendChild(tr);
  });
}


function updateDescriptions() {
  const tbody = document.getElementById("tbody_params");
  Array.from(tbody.children).forEach((tr) => {
    const paramName = tr.children[0]?.textContent;
    const tdDesc = tr.children[2];
    if (paramName && tdDesc) {
      tdDesc.textContent = (descriptions[paramName] && descriptions[paramName][currentLanguage]) || "-";
    }
  });
}


function highlightSelectedLang(lang) {
  ["en", "de", "fr"].forEach((l) => {
    const el = document.getElementById(`lang_${l}`);
    if (!el) return;
    el.classList.toggle("active", l === lang);
  });
}


function setLanguage(lang) {
  currentLanguage = lang;
  updateDescriptions();
  highlightSelectedLang(lang);
}


function onInputChange(e) {
  const input = e.target;
  let value = Number(input.value);
  if (isNaN(value)) return;
  Post("update", { target: input.id, value }).catch((e) => console.error(e));
}


function onButtonClick(type, name) {
  Post("change", { type, target: name })
    .then((result) => {
      if (result !== false && elements[name]) {
        elements[name].value = result;
      }
    })
    .catch((e) => console.error(e));
}


async function pushToServer() {
  const data = {};
  Object.keys(elements).forEach((key) => {
    data[key] = Number(elements[key].value) || 0;
  });
  const resp = await Post("push", data);
  if (resp && resp.success) {
    alert("Handling data successfully pushed to server!");
  } else {
    alert("Failed to push handling data!");
  }
}


// Neuer Teil: Anzeige der Fahrzeugliste vom Server und Klickbarkeit
function displayVehicleList(vehicles) {
  vehicleList = vehicles || [];
  const vehicleListDiv = document.getElementById("vehicleList");
  vehicleListDiv.innerHTML = "";

  if (!vehicleList.length) {
    vehicleListDiv.textContent = "No vehicles found on server.";
    return;
  }

  vehicleList.forEach((veh) => {
    const el = document.createElement("div");
    el.textContent = veh;
    el.style.cursor = "pointer";
    el.title = "Click to spawn this vehicle";
    el.addEventListener("click", () => spawnVehicle(veh));
    vehicleListDiv.appendChild(el);
  });
}

// Funktion zum Senden einer Fahrzeugspawnanfrage an den Server
function spawnVehicle(vehicleName) {
  if (!vehicleName) return;
  Post("spawnVehicle", { model: vehicleName })
    .then((resp) => {
      if (resp && resp.success) {
        alert(`Vehicle "${vehicleName}" spawned successfully!`);
      } else {
        alert(`Failed to spawn vehicle "${vehicleName}".`);
      }
    })
    .catch((e) => {
      console.error(e);
      alert("Error communicating with server.");
    });
}

// Suchfeld für Fahrzeugliste einrichten
function setupVehicleSearch() {
  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "vehicleSearch";
  searchInput.placeholder = "Search vehicles...";
  searchInput.style.marginBottom = "0.4rem";
  searchInput.style.width = "100%";
  searchInput.style.padding = "0.3rem";
  searchInput.style.borderRadius = "0.4rem";
  searchInput.style.border = "none";
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const children = document.getElementById("vehicleList").children;
    for (let i = 0; i < children.length; i++) {
      const text = children[i].textContent.toLowerCase();
      children[i].style.display = text.includes(filter) ? "" : "none";
    }
  });
  const container = document.getElementById("vehicleListContainer");
  container.insertBefore(searchInput, container.firstChild);
}


window.addEventListener("message", (event) => {
  let e = event.data;
  if (e.action === "show") {
    populateTable(e.handling, e.descriptions);
    document.getElementById("container").style.display = "block";
    if (e.vehicleList) {
      displayVehicleList(e.vehicleList);
    }
  } else if (e.action === "hide") {
    document.getElementById("container").style.display = "none";
  }
});


document.addEventListener("DOMContentLoaded", () => {
  ["en", "de", "fr"].forEach((l) => {
    const el = document.getElementById(`lang_${l}`);
    if (el) el.addEventListener("click", () => setLanguage(l));
  });
  highlightSelectedLang(currentLanguage);

  const pushBtn = document.getElementById("pushServer");
  if (pushBtn) pushBtn.addEventListener("click", pushToServer);

  setupVehicleSearch();
});


window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.getElementById("container").style.display = "none";
    Post("close");
  }
});
