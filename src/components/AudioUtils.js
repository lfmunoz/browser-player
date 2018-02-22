
export default {
  /*
  convert a Blob into a Uint8Array
  */
  blob_to_uint8arr: function (blob) {
    return new Promise((resolve) => {
      var fileReader = new FileReader()
      fileReader.onload = event => {
        resolve(new Uint8Array(event.target.result))
      }
      fileReader.readAsArrayBuffer(blob)
    })
  },

  /*
    Given a Uint8Array we append it so that the total size
    is a multiple of xBarCount. This is because we want to
    split Uint8Array into equal size buckets.
  */
  data_append: function (uint8Arr, xBarCount) {
    let remainder = xBarCount - uint8Arr.length % xBarCount
    let uint8ArrAdjust
    if (remainder !== xBarCount) {
      uint8ArrAdjust = new Uint8Array(uint8Arr.length + remainder)
      uint8ArrAdjust.set(uint8Arr, 0)
    } else {
      uint8ArrAdjust = uint8Arr
    }
    return uint8ArrAdjust
    // const chunkSize = uint8ArrAdjust.length / xBarCount;
  },

  /*
   Given a Uint8Array we shrink the array by takign the average of
   bucketSize points. We also map the acutally value to a number
   between 0 and maxPixelHeight.
  */
  to_pixel_height: function (uint8Arr, maxBarCount, maxPixelHeight) {
    let bucketSize = uint8Arr.length / maxBarCount
    let compress = []
    for (let x = 0; x < uint8Arr.length; x += bucketSize) {
      let sum = 0
      for (let y = 0; y < bucketSize; y++) {
        sum += (uint8Arr[x + y] / bucketSize)
      }
      compress.push(sum)
    }

    let adjusted = this.average_values(compress)

    let smallest = this.min_no_zero(adjusted)
    let largest = Math.max(...adjusted)

    let slope = (maxPixelHeight - 0) / (largest - smallest)
    let result = []
    for (let x = 0; x < adjusted.length; x++) {
      if (adjusted[x] === 0) {
        result.push(2)
      } else {
        let value = Math.round(slope * (adjusted[x] - smallest))
        result.push(value)
      }
    }
    return result
  },

  min_no_zero: function (intArr) {
    let start = 0
    while (intArr[start] === 0) {
      start++
    }
    let min = intArr[start]
    intArr.forEach(item => {
      if (item !== 0 && min > item) {
        min = item
      }
    })
    return min
  },

  average_values: function (intArr) {
    const percentile = 80
    let result = []
    // let average = intArr.reduce((previous, current) => current += previous) / intArr.length
    // let min = Math.min(...intArr)
    let max = Math.max(...intArr)
    intArr.forEach(item => {
      let value = (item / max) * 100
      if (value < percentile) {
        result.push(0)
      } else {
        result.push(value)
      }
    })
    return result
  }

}
