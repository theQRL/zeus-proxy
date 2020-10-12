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

Template.post.events({
  'click #GetAddressState-Testnet': () => {
    postData('/grpc/GetAddressState',
      JSON.parse($('#GetAddressState').val())
    )
    .then(data => {
      console.log(data)
      $('#outputJson').html(JSON.stringify(data))
      $('html').addClass('is-clipped')
      $('.modal').addClass('is-active')
    })
  },
  'click #GetOptimizedAddressState-Testnet': () => {
    postData('/grpc/GetOptimizedAddressState', 
      JSON.parse($('#GetOptimizedAddressState').val())
    )
    .then(data => {
      console.log(data)
      $('#outputJson').html(JSON.stringify(data))
      $('html').addClass('is-clipped')
      $('.modal').addClass('is-active')
    })
  },
})

Template.modal.events({
  'click .modal-close': () => {
    $('.modal').removeClass('is-active')
  }
})