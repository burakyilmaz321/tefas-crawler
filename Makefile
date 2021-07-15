clean:
	# build
	rm -rf build/
	rm -rf dist/
	rm -rf tefas_crawler.egg-info/
	rm -rf .eggs/
	# pyc
	find . -name '*.pyc' -exec rm -f {} +
	find . -name '*.pyo' -exec rm -f {} +
	find . -name '*~' -exec rm -f {} +
	find . -name '__pycache__' -exec rm -rf {} +
	# test
	rm -rf .pytest_cache/
	rm -rf .tox/
	rm .coverage
	rm coverage.xml

build:
	python setup.py sdist bdist_wheel

test:
	tox
