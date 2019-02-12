let video;
let poseNet;
let poses = [];
let font;
let fontsize = 20;
let url = '128.122.151.172';           // the hub IP address
let username = 'c3SJrXhFNuj3Hj-0c6Gin3xtZdmhuxQc7VH8R3uW';
let nose_pos = [];
let nod_threshold = 20;
let nose_num_threshold = 15;
let light_on = false;
//TODO: Use status report from the hub to initiate light on


//Import test font
function preload() {
    font = loadFont('assets/SourceSansPro-Regular.otf');
}

function setup() {
    //PostNet Set Up
    createCanvas(640, 480);
    textFont(font);
    textSize(fontsize);
    textAlign(CENTER, CENTER);
    video = createCapture(VIDEO);
    video.size(640, 480);
    poseNet = ml5.poseNet(video, modelReady);
    poseNet.on('pose', function(results) {
        poses = results;
    });
    video.hide();

    //Create Connection button from example
    let addressLabel, nameLabel, connectButton;
    addressField = createInput('text');
    addressLabel = createSpan("IP address:");
    addressLabel.position(700,10);
    addressField.position(800, 10);
    usernameField = createInput('text');
    nameLabel = createSpan("user name:");
    nameLabel.position(700,40);
    usernameField.position(800, 40);
    usernameField.value(username);
    addressField.value(url);

    // set up the connect button:
    connectButton = createButton("connect");
    connectButton.position(700, 70);
    connectButton.mouseClicked(connect);
}


function connect() {
    this.html("refresh");             // change the connect button to 'refresh', come on, really?
    controlArray = [];                // clear the control array
    url = "http://" + addressField.value() + '/api/' + usernameField.value() + '/lights/';
    httpDo(url, 'GET', getLights);
}


function getLights(result) {
    let lights = JSON.parse(result);		// parse the HTTP response
    console.log(lights);
}

function modelReady() {
    select('#status').html('Model Loaded');
}


function draw() {
    image(video, 0, 0, width, height);
    // We can call both functions to draw all keypoints and the skeletons
    drawKeypoints();
    detectNod();
}

// A function to draw ellipses over the detected keypoints
function drawKeypoints()  {
    // Loop through all the poses detected
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            // A keypoint is an object describing a body part (like rightArm or leftShoulder)
            let keypoint = pose.keypoints[j];
            // Only draw an ellipse is the pose probability is bigger than 0.2
            if (keypoint.score > 0.2) {
                // fill(255, 0, 0);
                // noStroke();
                // ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                fill(0);
                text(keypoint.part, keypoint.position.x, keypoint.position.y);
            }
        }
    }
}

//Function to check if head nods occurs - occurs -> adjust state for the light
function detectNod() {
    for (let i = 0; i < poses.length; i++) {
        // For each pose detected, loop through all the keypoints
        let pose = poses[i].pose;
        for (let j = 0; j < pose.keypoints.length; j++) {
            let keypoint = pose.keypoints[j];
            //Log the current dirs
            if (keypoint.score > 0.2) {
                // fill(255, 0, 0);
                // noStroke();
                // ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
                if (keypoint.part === "nose"){
                    nose_pos.push(keypoint.position);
                }
                fill(0);
                text(keypoint.part, keypoint.position.x, keypoint.position.y);
            }
        }
    }
    if (nose_pos.length === nose_num_threshold){
        let nose_pos_0 = nose_pos[0];
        let nose_pos_last = nose_pos[nose_pos.length - 1];
        if (nose_pos_last.y - nose_pos_0.y > nod_threshold){
            console.log("nod down detected");
            if (!light_on){
                light_on = true;
                let payload = {};
                payload["on"] = true;
                setLight(1, payload, 'state');
            }
            else{
                light_on = false;
                let payload = {};
                payload["on"] = false;
                setLight(1, payload, 'state');
            }
        }
        nose_pos = [];
    }
}


//Example code
function setLight(lightNumber, data, command) {
    let path = url + lightNumber + '/' + command;		// assemble the full URL
    let content = JSON.stringify(data);				 // convert JSON obj to string
    httpDo( path, 'PUT', content, 'text', getResponse); //HTTP PUT the change
}


function getResponse(response) {
    // show response:
    console.log(response);
}

