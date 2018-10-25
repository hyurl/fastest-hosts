# Fastest Hosts

因为这个程序目前只适合中国大陆用户，因此此文档使用中文简体编写。

经我本人的一些测试，国内的 DSN 服务商经常不能连接到访问速度最快的网站 IP地址，例如 
GitHub，非常让人头疼。使用这个程序，你可以直接将域名指向访问速度最快的服务器地址。

## 安装

```sh
npm i fastest-hosts
```

## 使用

这是一个命令行程序，在控制台或者 Shell 中使用下面的命令设置后移除规则。

- `fastest-hosts --set <host>` 设置指定的主机名/域名连接到速度最快的 IP 地址。示例：
    - `fastest-hosts --set github.com` 设置 GibHub
    - `fastest-hosts --set npmjs.com` 设置 NPM

- `fastest-hosts --remove <host>` 移除制定主机名/域名的规则。示例：
    - `fastest-hosts --remove github.com` 移除 GibHub
    - `fastest-hosts --remove npmjs.com` 移除 NPM

## 程序是如何工作的？

程序会首先根据给出的域名，向某服务网站请求相关信息，获取其能够访问的国内以及一些境外的
DNS 服务器为该域名所指的全部 IP 地址；然后，程序会启动数个任务进程去测试当前机器对这些
地址的访问速度（通过操作系统的 `ping` 命令），并计算出访问速度最快的 IP 地址。最后，
程序将这个 IP 地址和域名写入到系统的 `hosts` 文件中，从而在下次访问站点时，直接使用配置
的 IP 地址，而不是再去询问 DSN 服务器获取慢速的地址。

这个程序是跨平台的，你可以在 Windows, MacOS, Linux 系统中使用它，其他系统需要自己测试。

注意，你可能需要管理员权限（或者 `sudo` 命令）来运行这个程序。