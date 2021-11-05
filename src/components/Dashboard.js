import React, { Component } from "react";

import { setInterview } from "helpers/reducers";

import classnames from "classnames";

import Loading from "./Loading";
import Panel from "./Panel";

import axios from "axios";

import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";

 
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


class Dashboard extends Component {

  state = { 
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviews: {}
   }


  componentDidMount() {
    const focused = JSON.parse(localStorage.getItem("focused"));

    if (focused) {
      this.setState({ focused });
    }

    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };
    

  }

  componentDidUpdate(previousProps, previousState) {
    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

   selectPanel = (id) => {
     this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
     }))
  }

  componentWillUnmount() {
    this.socket.close();
  }

  render() {

    const paneldata = data
    
    .filter(
      panelItem => this.state.focused === null || this.state.focused === panelItem.id
     )

    .map((panelItem) => {
      return (
        <Panel 
          key={panelItem.id}
          label={panelItem.label}
          value={panelItem.getValue(this.state)}
          onSelect={() => this.selectPanel(panelItem.id)}
        />
      );
    })

    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

     console.log(this.state)
    if (this.state.loading) { 
       return <Loading />}
    

    return (<main className={dashboardClasses}>{paneldata}</main>);
  }
}

export default Dashboard;
