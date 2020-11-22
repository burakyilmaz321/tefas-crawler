import pathlib
from setuptools import setup

# The directory containing this file
HOME = pathlib.Path(__file__).parent

# Get the long description from README file
long_description = (HOME / "README.md").read_text()

# Get the requirements
install_requires = (HOME / "requirements.txt").read_text().splitlines()

# Call setup()
setup(
    name="tefas-crawler",
    version="0.1",
    description="Crawl the public data from Tefas.",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/burakyilmaz321/tefas-crawler",
    author="Burak Yilmaz",
    author_email="burakyilmaz321@gmail.com",
    license="MIT",
    classifiers=[
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Development Status :: 1 - Planning",
    ],
    packages=["tefas"],
    include_package_data=True,
    install_requires=install_requires,
    python_requires=">=3.6",
)
