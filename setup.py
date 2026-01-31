import setuptools

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setuptools.setup(
    name="tefas-crawler",
    version="0.1.0",
    author="Fatih Ustun",
    author_email="fatih@example.com",
    description="Crawler for Turkish Electronic Fund Trading Platform (TEFAS)",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/fatihustun/tefas-crawler",
    packages=setuptools.find_packages(),
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    python_requires=">=3.8",
    install_requires=[
        "httpx>=0.24.0",
        "pandas>=1.5.0",
        "marshmallow>=3.18.0",
        "python-dateutil>=2.8.0",
        "tenacity>=8.0.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.0.0",
            "pytest-cov>=4.0.0",
            "black>=23.0.0",
            "pylint>=2.17.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "tefas=tefas.cli:main",
        ],
    },
)
