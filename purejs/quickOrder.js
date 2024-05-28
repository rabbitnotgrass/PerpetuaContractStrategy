// Load CryptoJS library
const script = document.createElement("script");
script.src =
  "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js";
document.head.appendChild(script);

let num = 1;
const apiKey = "";
const secretKey = "";
const passphrase = "";
const method = "POST";
const requestPath = "/api/v5/trade/order";
const stopLossSpread = 0.0015;
let ordIndex = 1;

// Utility functions
function getContractNameFromURL() {
  const url = window.location.href;
  const contractName = url.split("/").pop();
  return contractName.toUpperCase();
}

function generateRandomString(length) {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }
  return result;
}

async function placeOrder(side, needSl) {
  const instId = getContractNameFromURL();
  const ordId = generateRandomString(4);
  const response = await fetch(
    `https://www.okx.com/api/v5/market/ticker?instId=${instId}`,
    { method: "GET" }
  );

  if (!response.ok) {
    console.error("Failed to fetch market data");
    return;
  }

  const info = await response.json();
  const { last, askPx, bidPx } = info.data[0];

  ordIndex++;

  const order = {
    instId,
    tdMode: "isolated",
    clOrdId: `testygghu00${ordId}`,
    side,
    ordType: "limit",
    px: side === "buy" ? askPx : bidPx,
    sz: num,
  };
  if (needSl) {
    const spx =
      side === "buy"
        ? parseFloat(askPx) - stopLossSpread
        : parseFloat(bidPx) + stopLossSpread;

    order.attachAlgoClOrdId = `algo${ordId}`;
    order.slTriggerPx = spx;
    order.slOrdPx = spx;
  }

  const body = JSON.stringify(order);
  const timestamp = new Date().toISOString();
  const message = timestamp + method + requestPath + body;
  const hmac = CryptoJS.HmacSHA256(message, secretKey);
  const signature = hmac.toString(CryptoJS.enc.Base64);

  const tradeResponse = await fetch(`https://www.okx.com${requestPath}`, {
    method,
    body,
    headers: {
      "OK-ACCESS-KEY": apiKey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": passphrase,
      "Content-Type": "application/json",
    },
  });

  const data = await tradeResponse.json();
  console.log(data);
}

// Button creation and event handlers
function createButton(text, color, marginLeft, onClick) {
  const button = document.createElement("button");
  button.innerHTML = text;
  button.style.backgroundColor = color;
  button.style.marginLeft = marginLeft;
  button.addEventListener("click", onClick);
  return button;
}

const parentElement = document.querySelector(
  'div[class="okui-tabs-pane-list-wrapper"]'
);

const sellLimitBtn = createButton("止损卖", "red", "30px", () =>
  placeOrder("sell", true)
);
const buyLimitBtn = createButton("止损买", "green", "30px", () =>
  placeOrder("buy", true)
);

const sellLimitBt1 = createButton("只卖", "red", "30px", () =>
  placeOrder("sell", false)
);
const buyLimitBtn1 = createButton("只买", "green", "30px", () =>
  placeOrder("buy", false)
);

const buttons = [
  { text: "10", numValue: 10 },
  { text: "20", numValue: 20 },
  { text: "40", numValue: 40 },
  { text: "50", numValue: 50 },
  { text: "80", numValue: 80 },
  { text: "100", numValue: 100 },
];
parentElement.appendChild(sellLimitBtn);
parentElement.appendChild(buyLimitBtn);
buttons.forEach(({ text, color, numValue }) => {
  const button = createButton(text, "white", "20px", () => (num = numValue));
  parentElement.appendChild(button);
});

parentElement.appendChild(sellLimitBt1);
parentElement.appendChild(buyLimitBtn1);
