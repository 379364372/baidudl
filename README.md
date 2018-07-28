# baidu-dl

It is for extracting high speed download links from pan.baidu.com.

## Important Notes

The [old baidudl extension](https://chrome.google.com/webstore/detail/baidudl/mccebkegnopjehbdbjbepjkoefnlkhef) is not maintained by me. And it has been found to be modified to be a **malicious extension** which will use your facebook token to do something unknown. If you are not sure about which version you are using, please reinstall the extension.

## Installation

### Method1: [Find this extension on chrome web store](https://chrome.google.com/webstore/detail/baidudl/lflnkcmjnhfedgibjackiibmcdnnoadb)

### Method2: Manually install this extension to get latest version:

#### Step1:

run command line `git clone https://github.com/Kyle-Kyle/baidudl`

#### Step2:

Open Chrome and navigate to [chrome://extensions](chrome://extensions)

#### Step3:

Enable Developer mode by ticking the checkbox in the upper-right corner

#### Step4:

Click on the "Load unpacked extension..." button

#### Step5:

Select the directory containing baidudl

## How to use baidudl so that your download speed won't be limited

![a screenshot](https://raw.githubusercontent.com/Kyle-Kyle/baidudl/master/extension/screenshots/screenshot3.png)


### Method1: Directly download(not recommended)

#### Step 1:

Navigate your browser to download page

#### Step 2:

Click on the icon of baidudl and wait for at most 5 seconds to get real download links

#### Step 3:

Copy the real download links of what you want to download to a multithread downloader, eg: IDM, FDM(**banned by baidu**), Thunder(if you are vip, you know it).

### Method2: RPC download(recommended)

#### Step 1:

Enable RPC Mode in options

#### Step 2-3:

Same to Diretly download Step 1-2

#### Step 4:

Open up `baidudl_rpc`, or run cmd `aria2c --enable-rpc -j 1`

#### Step 5:

Click `RPCdownload` button

## Contact me

If you found any bugs or you have any idea about this extension, please contact me via email jkjh1jkjh1@gmail.com or [create an issue](https://github.com/Kyle-Kyle/baidudl/issues/new).
