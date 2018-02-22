
// import flushPromises from 'flush-promises'

// import WebAmp from '../WebAmp.vue'
import AudioUtils from '../AudioUtils'

// jest.mock('pixi.js'); //
// https://stackoverflow.com/questions/46158728/how-to-mock-third-party-modules-with-jest
// https://github.com/audiocogs/mp3.js
// jest.mock('pixi.js', () => jest.fn())

describe('AudioUtils.js', () => {
  test('data_append() always a mulitple of xBarCount', () => {
    const xBarCount = 10
    expect(AudioUtils.data_append([1, 2, 3, 4, 5, 6, 7, 8, 9], xBarCount).length).toBe(10)
    expect(AudioUtils.data_append([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], xBarCount).length).toBe(10)
    expect(AudioUtils.data_append([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], xBarCount).length).toBe(20)
    expect(AudioUtils.data_append([1], xBarCount).length).toBe(10)
  })

  /*
  test('to_pixel_height()', () => {
    let maxPixelHeight = 6;
    let maxBarCount = 2;
    expect(AudioUtils.to_pixel_height([255,255,128,128], maxBarCount, maxPixelHeight))
      .toEqual([6,3])

    maxPixelHeight = 50;
    maxBarCount = 10;
    expect(AudioUtils.to_pixel_height([10,20,30,40,50,60,70,80,90,100], maxBarCount, maxPixelHeight))
      .toEqual([5,10,15,20,25,30,35,40,45,50])

  })
  */

  test('blob_to_uint8arr', async () => {
    // var oMyBlob = new Blob([], {type : 'text/html'});
    var blob = new Blob(['a', 'b', 'c'])
    expect(await AudioUtils.blob_to_uint8arr(blob))
      .toEqual(new Uint8Array([97, 98, 99]))
  })
})
