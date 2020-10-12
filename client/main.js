global.Buffer = global.Buffer || require("buffer").Buffer
import JSONFormatter from 'json-formatter-js'
import './main.html'

async function postData(url = '', data = {}) {
  const response = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
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

Template.post.events({
  'click #GetStats-Testnet': () => {
    postData('/grpc/GetStats',
      JSON.parse($('#GetStats').val())
    )
    .then(data => displayData(data))
  },
  'click #GetAddressState-Testnet': () => {
    postData('/grpc/GetAddressState',
      JSON.parse($('#GetAddressState').val())
    )
    .then(data => displayData(data))
  },
  'click #GetOptimizedAddressState-Testnet': () => {
    postData('/grpc/GetOptimizedAddressState', 
      JSON.parse($('#GetOptimizedAddressState').val())
    )
    .then(data => displayData(data))
  },
  'click #GetObject-Testnet': () => {
    postData('/grpc/GetObject', 
      JSON.parse($('#GetObject').val())
    )
    .then(data => displayData(data))
  },
})

Template.modal.events({
  'click .modal-close': () => {
    $('.modal').removeClass('is-active')
  }
})