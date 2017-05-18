import React from 'react'
import API from '../api'

import APIStatus from '../components/api-status'
import TotalLagStats from '../components/total-lag-stats'
import MergedLagStats from '../components/merged-lag-stats'
import Spinner from '../components/spinner'
import StatusWidget from '../components/status-widget'
import Toggle from 'material-ui/Toggle';
import burrowStatsOptions from '../utils/burrow-stats-options'

const MERGE_CHARTS_CACHE_KEY = 'burrowStats-lag-view-merge-charts'

export default React.createClass({
  fetch() {
    API.Consumer
      .lag()
      .then((response) => {
        !this.props.apiError && this._isMounted ? this.setState(response.data) : null
      })
  },

  getInitialState() {
    return {
      mergeCharts: false,
      data: null
    }
  },

  componentWillMount() {
    this._isMounted = true
    const mergeCharts = JSON.parse(localStorage.getItem(MERGE_CHARTS_CACHE_KEY))
    this.setState({mergeCharts})
    this.fetch()
  },

  render() {
    return (
      <div className='consumer-lag-view'>
        <APIStatus text={this.props.apiError} />
        <Toggle className='chart-merge-toggle'
                label='Merge charts'
                labelPosition='right'
                defaultToggled={this.state.mergeCharts}
                onToggle={this.toggleMergeCharts}/>
        {
          this.state.data ?
            this.renderTotalLagStats() :
            <Spinner />
        }
      </div>
    )
  },

  componentDidMount() {
    console.log(`Polling consumer-lag-view every ${burrowStatsOptions().pollInterval}s`)
    this._intervalId = setInterval(() => this.fetch(), burrowStatsOptions().pollInterval * 1000)
  },

  componentWillUnmount() {
    this._isMounted = false
    clearInterval(this._intervalId)
  },

  toggleMergeCharts(event, enabled) {
    localStorage.setItem(MERGE_CHARTS_CACHE_KEY, enabled)
    this.setState({mergeCharts: enabled})
  },

  renderTotalLagStats() {
    if (this.state.mergeCharts) {
      return <MergedLagStats consumers={this.state.data} />
    }

    return this.state
      .data
      .map((consumerData) => {
        if (!consumerData.consumer_group.offsets){
          return <StatusWidget key={consumerData.name} name={consumerData.name} status='Consumer Group Inactive' />
        } else {
          return <TotalLagStats key={consumerData.name} {...consumerData} />
        }
      })
  }
})
