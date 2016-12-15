![Convolv Logo](https://convo.lv/img/convolv-logo.png)

# The Math Terminal

###![Convolv Icon](https://convo.lv/img/convolv-avatar-forall.png) is now on the web at [Convolv](https://convo.lv/)


## Overview
Convolv is a web application that provides a console for the analysis of data. Built with vanilla JS and incorporating more than a dozen open-source libraries, the application allows a user to import data, perform numerical analyses and chart the results.


## Number Crunching 

Besides having built-in support for the powerful [Math.js](http://mathjs.org/) library, additional features have been incorporated including:
- Simple waveform generator: square, pulse, triangular, etc.
- Polynomial string construction for latex output
- Common signal processing algorithms including (more are in development):   
`fft()`: fast and discrete Fourier transform   
`ifft()`: fast and discrete inverse Fourier transform  
`fsps()`: partial sums of Fourier series   
`conv()`: convolution   
`deconv()`: deconvolution (polynomial division)  
`corr()`: cross and auto correlation   
`filter()`: a 1D transposed direct form II digital filter structure

## Charts

We've also included the awesome [Highcharts](http://www.highcharts.com/products/highcharts) library to provide support for the following chart types:
- line
- curve
- log
- sample
- area
- bar
- column
- polar
- pie

## Data

Data can be entered manually or imported/exported as:
- csv from a local drive
- JSON data from a URL (support for tokens is available)

In addition, JSON data imported from a URL can be displayed in a datatable.

## Screenshots

![Convolv Import Data from URL](https://convo.lv/img/convolv-04-screenshot.jpg)

![Convolv Import and Export to File](https://convo.lv/img/convolv-08-screenshot.jpg)

## Credits

#### Note: The libraries below are covered by their respective licenses.

Convolv is only a reality thanks to these amazing Github projects:

- [Highcharts](https://github.com/highcharts/highcharts)
- [MathJS](https://github.com/josdejong/mathjs)
- [KaTeX](https://github.com/Khan/KaTeX)
- [Awesomplete](https://github.com/LeaVerou/awesomplete)
- [Terminal](https://github.com/SDA/terminal)
- [Fetch](https://github.com/github/fetch)
- [Moment](https://github.com/moment/moment)
- [FileSaver.js](https://github.com/eligrey/FileSaver.js)
- [Ink](https://github.com/sapo/Ink)
- [PapaParse](https://github.com/mholt/PapaParse)
- [Hack](https://github.com/chrissimpkins/Hack)
- [Datatable](https://github.com/Holt59/datatable)
- [FontAwesome](https://github.com/FortAwesome/Font-Awesome)
- [Codrops Grid Gallery](https://github.com/codrops/GridGallery)
- [Bulma](https://github.com/jgthms/bulma)
- [Smooth Scroll](https://github.com/cferdinandi/smooth-scroll)
- [ES6 Shim](https://github.com/paulmillr/es6-shim)
- [Github Cards](https://github.com/lepture/github-cards)

## License

Please see the [license](LICENSE.md) file.