import React from "react";
import { v4 as uuid } from "uuid";
import Webcam from "react-webcam";
import "./App.css";

const baseUrl = "http://localhost:8080";

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      Count: 0,
      isRunning: false,
      isKdash: false
    };
    this.webcamRef = React.createRef(null);
  }

  storeBlob = async (trip_id, time, base64) => {
    try {
      const headers = {
        "Content-Type": "application/json",
      };

      const body = {
        time,
        data:base64,
        trip_id,
      };

      const url =  `/api/${this.state.isKdash ?  'kdash':'tripper'}/images` 
      const response = await fetch(baseUrl + url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if(response.status !== 200) throw new Error('Failed to upload!')

      this.setState((previous) => ({
        Count: previous.Count + 1,
      }));
    
    } catch (err) {
      console.error(err.message);
    }
  };

  start = () => {
    this.setState({ isRunning: true });

    if (this.intervalSubscription) {
      clearInterval(this.intervalSubscription);
    }

    const trip_id = uuid();

    console.log("CREATED TRIP ", trip_id);

    this.intervalSubscription = setInterval(async () => {
      const time = Date.now();
      const base64 = await this.getBlob();
      this.storeBlob(trip_id, time, base64);
    }, 1000);
  };

  componentWillUnmount() {
    clearInterval(this.intervalSubscription);
  }

  stop = () => {
    this.setState({ isRunning: false });
    if (this.intervalSubscription) {
      clearInterval(this.intervalSubscription);
    }
  };

  getBlob = async () => {
    const canvas = this.webcamRef.current.getCanvas();
    var pngUrl = canvas.toDataURL('image/png',0.4); 
    return pngUrl
    // return new Promise((resolve, reject) => {
      // canvas.toBlob((blob) => {
      //   console.log(blob);
      //   resolve(blob);
      // });
    // });
  };


  render() {
    const { isRunning } = this.state;
    return (
      <div className={"day"}>
        <div className="Dropzone-page">
          <Webcam
            ref={this.webcamRef}
            muted={true}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              marginLeft: "auto",
              marginRight: "auto",

              textAlign: "center",
              zindex: 9,
              width: 640,
              height: 640,
            }}
          />

          <canvas
            id="canvas"
            width="640"
            height="640"
            style={{
              position: "absolute",
              marginLeft: "auto",
              marginRight: "auto",
              left: 0,
              right: 0,
              textAlign: "center",
              zindex: 8,
              width: 640,
              height: 640,
            }}
          />
        </div>
        <div
          id="im"
          style={{ width: 500, height: 500, backgroundRepeat: "no-repeat" }}
        ></div>
        <div
          id="im2"
          style={{ width: 500, height: 500, backgroundRepeat: "no-repeat" }}
        ></div>
        <div className="container bg-light ">
          <div className="col-md-12  text-center">
            <div className="fixed-bottom">
              {!isRunning ? (
                <button
                  type="button"
                  className="btn btn-primary mx-1"
                  onClick={this.start}
                >
                  Start
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-danger mx-1 text-center"
                  onClick={this.stop}
                >
                  Stop
                </button>
              )}

                <button
                  type="button"
                  className="btn mx-1 text-center"
                  style={{
                    backgroundColor: this.state.isKdash ? 'blue' : 'gray'
                  }}
                  onClick={() => this.setState({isKdash:true})}
                >
                  KDASH
                </button> 
                <button
                  type="button"
                  className="btn mx-1 text-center"
                  style={{
                    backgroundColor: !this.state.isKdash ? 'blue' : 'gray'
                  }}
                  onClick={() => this.setState({isKdash:false})}
                >
                  TRIPPER
                </button>

              <p className={"day-text"}> Uploaded: {this.state.Count}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default App;
