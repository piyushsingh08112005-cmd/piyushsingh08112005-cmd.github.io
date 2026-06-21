# Piyush Singh - Developer Portfolio

Modern glassmorphism portfolio with dynamic code loading for GitHub Pages.

## 🚀 Live Demo
https://piyushsingh08112005-cmd.github.io

## ✨ Features
- Glassmorphism UI with dark/light mode
- Folder-based code system by language and difficulty
- Dynamic loading from JSON
- Interactive modal with Prism.js syntax highlight
- Run C/C++ on Replit, Python on Colab
- Copy to clipboard
- Fully responsive

## 📁 Folder Structure
```
codes/c/basic/        - Beginner C codes
codes/c/advanced/     - Intermediate C codes
codes/c/expert/       - Advanced C codes
codes/cpp/basic/      - Beginner C++ codes
codes/cpp/advanced/   - Intermediate C++ codes
codes/cpp/expert/     - Advanced C++ codes
codes/python/basic/   - Beginner Python codes
codes/python/advanced/ - Intermediate Python codes
codes/python/expert/  - Advanced Python + Colab notebooks
data/codes.json       - All code metadata
```

## ➕ How to Add New Code
1. Create a `.c` / `.cpp` / `.py` file in the matching `codes/<lang>/<level>/` folder
2. Copy the code content
3. Add a new object in `data/codes.json` with `lang`, `level`, `title`, `filename`, `code`. Use `\n` for new lines
4. For Python Expert projects, add a `"colab"` field with your Colab notebook link
5. Commit & push to GitHub

## 🔬 Google Colab for Python Projects
For Data Science, ML, and Visualization projects, add a Colab notebook link in `codes.json`'s `"colab"` field. Clicking "Open in Colab 🚀" runs the notebook directly in Google's cloud.

## 🛠️ Tech Stack
HTML5, CSS3, Vanilla JS, Prism.js, Replit, Google Colab, GitHub Pages

## 👨‍💻 About Me
BCA 2nd Semester Student | Learning C, C++, Python | Lucknow, India

## 📬 Contact
- Email: piyushsingh08112005@gmail.com
- GitHub: [@piyushsingh08112005-cmd](https://github.com/piyushsingh08112005-cmd)

Made with ❤️
