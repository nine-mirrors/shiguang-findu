#!/bin/bash

# ============================================
# 拾光寻物平台 - 一键部署脚本
# ============================================

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  拾光寻物平台 - 部署脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}错误: 未安装 Node.js${NC}"
    exit 1
fi

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}错误: 未安装 npm${NC}"
    exit 1
fi

# 安装依赖
echo -e "${YELLOW}安装项目依赖...${NC}"
npm install

# 构建生产版本
echo -e "${YELLOW}构建生产版本...${NC}"
npm run build

# 创建部署目录
DEPLOY_DIR="/var/www/shiguang-findu"
if [ ! -d "$DEPLOY_DIR" ]; then
    echo -e "${YELLOW}创建部署目录...${NC}"
    sudo mkdir -p $DEPLOY_DIR
fi

# 复制文件
echo -e "${YELLOW}复制静态文件到部署目录...${NC}"
sudo cp -r dist/* $DEPLOY_DIR/

# 设置权限
echo -e "${YELLOW}设置文件权限...${NC}"
sudo chown -R www-data:www-data $DEPLOY_DIR

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  部署完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "静态文件已部署到: ${YELLOW}$DEPLOY_DIR${NC}"
echo ""
echo -e "使用 Nginx 配置示例:"
echo -e "  1. 复制 nginx.conf 到 /etc/nginx/sites-available/shiguang-findu"
echo -e "  2. 创建软链接: sudo ln -s /etc/nginx/sites-available/shiguang-findu /etc/nginx/sites-enabled/"
echo -e "  3. 重载Nginx: sudo nginx -s reload"
echo ""
echo -e "或者使用内置服务器预览:"
echo -e "  npm run preview"
echo ""
