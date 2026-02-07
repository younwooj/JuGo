import os
from pathlib import Path

def aggregate_project_code(root_dir, output_file):
    # 제외할 폴더 및 파일 확장자 설정
    exclude_dirs = {'.git', 'node_modules', '.next', 'dist', 'build', '.cursor', 'public'}
    include_extensions = {'.ts', '.tsx', '.py', '.sql', '.md', '.json'}
    exclude_files = {'package-lock.json', 'yarn.lock'}

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"# Project Source Code Summary: {os.path.basename(root_dir)}\n\n")
        
        for root, dirs, files in os.walk(root_dir):
            # 제외 폴더 필터링
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                file_path = Path(root) / file
                if file_path.suffix in include_extensions and file not in exclude_files:
                    # 파일 상대 경로 작성
                    relative_path = file_path.relative_to(root_dir)
                    f.write(f"\n--- FILE: {relative_path} ---\n")
                    f.write(f"``` {file_path.suffix[1:]}\n")
                    try:
                        f.write(file_path.read_text(encoding='utf-8'))
                    except Exception as e:
                        f.write(f"// Error reading file: {e}\n")
                    f.write("\n```\n")

if __name__ == "__main__":
    # 프로젝트 루트 경로에서 실행
    aggregate_project_code('.', 'project_full_context.md')
    print("코드 집계 완료: project_full_context.md")