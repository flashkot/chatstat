const iconData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAACyUlEQVR42g2Kw8IsRwBGq7qrjbHx24pt297EeYhgn1eJbdu2x7rT0nQ1K3f14Rz4+CWPsDQTxCGEcJ75MV+bvfW9d/tDV2zttCgKui4GBPR7s48/+GVJEq44d5/eK+9kOaXvjHuLLpC7NEp+/GcRpinGoaKIx+1cXlJUsdEoOlH87Xf/0CWZSwnKtf64/rz+RbvpSjYpi+n7H096x1yeZ8rVLEVRAY5GI+3o5PUAEkQDk2S/uO08oIpcTiYCC9ZrKCvBx54ax67n6ObhaduTsbG6VpuO9VxOoWNWvv1scFYDYQ8QhjJcaNiwVgA/d+JSAZQF+8PPR/liplBUBn1ta7eJQkjKGchRQGaIIpPYJwUnMRgg8/CvfqSoQnu52vlv9tMPncuvPhnjCN2yeqW5+DhWgaZR/T5gAFxWiWklEyuVK9X2KUf1RmE0nL/63G+dv21R5JHMyh/+jE5cDdZqIEkghACH4MOv4srh5vkXHy6tVGYTM8DJDdddV681n3vySZo0lwh9DBNqOg9xkAw1+MZ38O2fpcMzNtd3mq7j//JT5+XnvqkVG/VyjUwJvPeuxzZyH28ug38G3pc/WW1hc7vWghAOsOmX+MiDjKEqrLLWWGEYpp6pov3Rl/40+CWMDrflVkX45jtvkUj10kZg2zW+IeckbpXjEMcgNNYnFE2jAkqNgP3ta3+gzQ/W5X91o6Je2q5u5bMuTdEcw0VxRADx8AJCaLkW0oKQoSg2pX78PWExgw2OWoFJmgis4Pre8dKZ9jzszVxf8/BU76GIBjgXdazFPRedVlGVr377Iy+JpmuanvXvuPPP+L8f+r8FQGosX4GQghGDhiQ9yFfzBsmIQoBD2/Xf//lTqpRoeAq6Kp+yoR+ATJvl5Cj0OE6hz7tIHnn67yMnDWLT1H4Yzj8a/JdfDhIY2oO0LlU5ignEsiRVASBRtPgfsTtyfOTGBUwAAAAASUVORK5CYII=";

export function setFavIcon() {
  let ico = document.createElement("link");
  ico.setAttribute("rel", "shortcut icon");
  ico.setAttribute("href", iconData);
  document.querySelector("head").appendChild(ico);
}
