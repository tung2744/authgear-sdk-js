REF := $(shell git describe --all --exact-match | sed -e "s|^heads/||")
GIT_HASH ?= git-$(shell git rev-parse --short=12 HEAD)
IMAGE ?= quay.io/theauthgear/authgear-demo-webapp:$(GIT_HASH)

# The documentation build pipeline works in the following way.
#
# 1. Generate individual .d.ts with tsc.
# 2. Generate rollup .d.ts with api-extractor.
# 3. Generate markdown files with typedoc and typedoc-plugin-markdown
# 4. Rewrite document ID.
# 5. Generate sidebars.js
.PHONY: docs
docs:
	rm -rf ./temp/
	mkdir -p ./temp/docs
	npm run dts
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.web.json \
		--name @authgear/web \
		--entryPoints packages/authgear-web/index.d.ts \
		--out ./temp/docs/web \
		--namedAnchors \
		--entryDocument index.md
	npx typedoc \
		--options typedoc/typedoc.json \
		--tsconfig typedoc/tsconfig.react-native.json \
		--name @authgear/react-native \
		--entryPoints packages/authgear-react-native/index.d.ts \
		--out ./temp/docs/react-native \
		--namedAnchors \
		--entryDocument index.md
	cp ./typedoc/index.md ./temp/docs/index.md
	cp ./typedoc/web_index.md ./temp/docs/web/index.md
	cp ./typedoc/react_native_index.md ./temp/docs/react-native/index.md
	node ./scripts/generate_sidebars_js.js ./temp/docs >./temp/sidebars.js
	rm -rf ./website/docs
	cp -R ./temp/docs/. ./website/docs
	cp ./temp/sidebars.js ./website
	(cd website && yarn build)

.PHONY: deploy-docs
deploy-docs: docs
	./scripts/deploy_docs.sh

.PHONY: build-image
build-image:
	docker build --tag $(IMAGE) --file ./example/reactweb/Dockerfile .

.PHONY: push-image
push-image:
	docker push $(IMAGE)
