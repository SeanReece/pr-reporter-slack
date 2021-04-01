#!/bin/sh
echo 'Updating git tag v1'
git push origin :refs/tags/v1
git tag -fa v1
git push origin master --tags
echo 'done'
