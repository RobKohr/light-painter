(() => {
  // The width and height of the captured output. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  const width = 640; // We will scale the output width to this
  let height = 0; // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  let streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  let video = null;
  let canvas = null;
  let output = null;
  let startbutton = null;

  function showViewLiveResultButton() {
    if (window.self !== window.top) {
      // Ensure that if our document is in a frame, we get the user
      // to first open it in its own tab or window. Otherwise, it
      // won't be able to request permission for camera access.
      document.querySelector(".contentarea").remove();
      const button = document.createElement("button");
      button.textContent = "View live result of the example code above";
      document.body.append(button);
      button.addEventListener("click", () => window.open(location.href));
      return true;
    }
    return false;
  }

  async function startup() {
    if (showViewLiveResultButton()) {
      return;
    }
    video = document.getElementById("video");
    canvas = document.getElementById("canvas");
    output = document.getElementById("output");
    startbutton = document.getElementById("startbutton");

    navigator.mediaDevices
      .getUserMedia({
        video: {
          width: { ideal: 1800 },
          height: { ideal: 900 },
        },
        audio: false,
      })
      .then((camera) => {
        console.log(camera);
        let settings = camera.getVideoTracks()[0].getSettings();
        console.log("settings", settings);

        video.srcObject = camera;
        video.play();
      })
      .catch((err) => {
        console.error(`An error occurred: ${err}`);
      });

    video.addEventListener(
      "canplay",
      (ev) => {
        if (!streaming) {
          height = video.videoHeight / (video.videoWidth / width);
          console.log(height);
          // Firefox currently has a bug where the height can't be read from
          // the video, so we will make assumptions if this happens.

          if (isNaN(height)) {
            height = width / (4 / 3);
          }

          video.setAttribute("width", width);
          video.setAttribute("height", height);
          canvas.setAttribute("width", width);
          canvas.setAttribute("height", height);
          streaming = true;
          convertToGrayscale();
        }
      },
      false
    );
    function convertToGrayscale() {
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0, width, height);
      const imageData = context.getImageData(0, 0, width, height);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg; // red
        data[i + 1] = avg; // green
        data[i + 2] = avg; // blue
      }
      context.putImageData(imageData, 0, 0);
      // output to output element
      const dataURI = canvas.toDataURL("image/png");
      output.setAttribute("src", dataURI);
      setTimeout(convertToGrayscale, 1000 / 60);
    }

    startbutton.addEventListener(
      "click",
      (ev) => {
        takepicture();
        ev.preventDefault();
      },
      false
    );

    clearoutput();
  }

  // Fill the output with an indication that none has been
  // captured.

  function clearoutput() {
    const context = canvas.getContext("2d");
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const data = canvas.toDataURL("image/png");
    output.setAttribute("src", data);
  }

  // Capture a output by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    const context = canvas.getContext("2d");
    if (width && height) {
      canvas.width = width;
      canvas.height = height;

      context.drawImage(video, 0, 0, width, height);

      const data = canvas.toDataURL("image/png");
      output.setAttribute("src", data);
    } else {
      clearoutput();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener("load", startup, false);
})();

function goFullScreen() {
  var canvas = document.getElementById("output");
  if (canvas.requestFullScreen) canvas.requestFullScreen();
  else if (canvas.webkitRequestFullScreen) canvas.webkitRequestFullScreen();
  else if (canvas.mozRequestFullScreen) canvas.mozRequestFullScreen();
}
