let map;
let geocoder;
let customers = [];

// 🔴 พิกัดร้าน (กำหนดตรงนี้จุดเดียว)
const SHOP_LOCATION = {
  name: "ที่ตั้งร้าน",
  lat: 13.1506571,
  lng: 100.971802
};

function initMap() {
  const center = { lat: SHOP_LOCATION.lat, lng: SHOP_LOCATION.lng };

  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 13,
    center: center,
  });

  geocoder = new google.maps.Geocoder();

  loadCustomers();
}

// 🔥 โหลดข้อมูลจาก backend
async function loadCustomers() {
  try {
    const res = await fetch("http://localhost:3000/customers");
    customers = await res.json();

    // 🔥 ถ้าไม่มีร้าน → เพิ่มเข้า DB อัตโนมัติ
    const hasShop = customers.some(c => c.name === "ที่ตั้งร้าน");

    if (!hasShop) {
      await addShopToDB();
      return;
    }

    renderMarkers();
  } catch (err) {
    console.error("โหลดข้อมูลไม่ได้:", err);
  }
}

// 🔥 เพิ่มร้านเข้า DB (ครั้งเดียว)
async function addShopToDB() {
  await fetch("http://localhost:3000/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(SHOP_LOCATION)
  });

  loadCustomers();
}

// 🔥 วาดหมุด
function renderMarkers() {
  customers.forEach(c => {

    const isShop = c.name === "ที่ตั้งร้าน";

    const content = `
      <b>${c.name}</b><br>
      ${isShop ? "" : `<button onclick="deleteMarker(${c.id})">ลบ</button>`}
    `;

    const info = new google.maps.InfoWindow({
      content: content
    });

    // 🔴 ร้าน = วงกลม
    if (isShop) {
      const circle = new google.maps.Circle({
        strokeColor: "#FF0000",
        fillColor: "#FF0000",
        fillOpacity: 0.5,
        map: map,
        center: { lat: c.lat, lng: c.lng },
        radius: 200
      });

      circle.addListener("click", (e) => {
        info.setPosition(e.latLng);
        info.open(map);
      });

    } 
    // 🔵 ลูกค้า = หมุด
    else {
      const marker = new google.maps.Marker({
        position: { lat: c.lat, lng: c.lng },
        map: map,
        icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      });

      marker.addListener("click", () => {
        info.open(map, marker);
      });
    }
  });
}

// 🔥 ลบหมุด
async function deleteMarker(id) {
  if (!confirm("ยืนยันการลบ?")) return;

  try {
    const customer = customers.find(c => c.id === id);

    // ❌ กันลบร้าน
    if (customer.name === "ที่ตั้งร้าน") {
      alert("ลบตำแหน่งร้านไม่ได้");
      return;
    }

    const res = await fetch(`http://localhost:3000/delete/${id}`, {
      method: "DELETE"
    });

    if (!res.ok) {
      alert("ลบไม่สำเร็จ");
      return;
    }

    loadCustomers();
  } catch (err) {
    console.error("ลบไม่ได้:", err);
  }
}

// 🔥 เพิ่มหมุด
function addLocation() {
  const input = document.getElementById("input").value;

  if (input.includes("google.com/maps")) {
    const latMatch = input.match(/!3d([0-9.]+)/);
    const lngMatch = input.match(/!4d([0-9.]+)/);

    if (latMatch && lngMatch) {
      saveToDB(parseFloat(latMatch[1]), parseFloat(lngMatch[1]));
      return;
    }
  }

  geocoder.geocode({ address: input }, (results, status) => {
    if (status === "OK") {
      const loc = results[0].geometry.location;
      saveToDB(loc.lat(), loc.lng());
    } else {
      alert("หา location ไม่เจอ");
    }
  });
}

// 🔥 บันทึกลูกค้า
async function saveToDB(lat, lng) {
  try {
    const res = await fetch("http://localhost:3000/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: "ลูกค้าใหม่",
        lat,
        lng
      })
    });

    if (!res.ok) {
      alert("บันทึกไม่สำเร็จ");
      return;
    }

    loadCustomers();
  } catch (err) {
    console.error("save error:", err);
  }
}

window.onload = initMap;