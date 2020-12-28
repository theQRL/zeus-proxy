global.Buffer = global.Buffer || require('buffer').Buffer
import JSONFormatter from 'json-formatter-js'
import './main.html'

async function getData(url = '') {
  const response = await fetch(url, {
    method: 'GET',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
  })
  return response.json()
}

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  })
  return response.json()
}

function displayData(data) {
  console.log(data)
  const formatter = new JSONFormatter(data, 2)
  $('#outputJson').html(formatter.render())
  $('html').addClass('is-clipped')
  $('.modal').addClass('is-active')
}

Template.get.events({
  'click #GetStats-get-Testnet': () => {
    getData('/grpc/testnet/GetStats').then((data) => displayData(data))
  },
  'click #GetStats-get-Mainnet': () => {
    getData('/grpc/mainnet/GetStats').then((data) => displayData(data))
  },
})

Template.post.events({
  'click #GetStats-Testnet': () => {
    postData(
      '/grpc/testnet/GetStats',
      JSON.parse($('#GetStats').val())
    ).then((data) => displayData(data))
  },
  'click #GetStats-Mainnet': () => {
    postData(
      '/grpc/mainnet/GetStats',
      JSON.parse($('#GetStats').val())
    ).then((data) => displayData(data))
  },
  'click #GetAddressState-Testnet': () => {
    postData(
      '/grpc/testnet/GetAddressState',
      JSON.parse($('#GetAddressState').val())
    ).then((data) => displayData(data))
  },
  'click #GetOptimizedAddressState-Testnet': () => {
    postData(
      '/grpc/testnet/GetOptimizedAddressState',
      JSON.parse($('#GetOptimizedAddressState').val())
    ).then((data) => displayData(data))
  },
  'click #GetObject-Testnet': () => {
    postData(
      '/grpc/testnet/GetObject',
      JSON.parse($('#GetObject').val())
    ).then((data) => displayData(data))
  },
  'click #GetObject-Mainnet': () => {
    postData(
      '/grpc/mainnet/GetObject',
      JSON.parse($('#GetObject').val())
    ).then((data) => displayData(data))
  },
  'click #GetTokensByAddress-Testnet': () => {
    postData(
      '/grpc/testnet/GetTokensByAddress',
      JSON.parse($('#GetTokensByAddress').val())
    ).then((data) => displayData(data))
  },
  'click #GetTokensByAddress-Mainnet': () => {
    postData(
      '/grpc/mainnets/GetTokensByAddress',
      JSON.parse($('#GetTokensByAddress').val())
    ).then((data) => displayData(data))
  },
})

Template.modal.events({
  'click .mc': () => {
    $('.modal').removeClass('is-active')
    $('html').removeClass('is-clipped')
  },
})
