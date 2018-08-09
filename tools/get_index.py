# This program is used to get index from words.js, phrases.js, symbols.js

fr = "../src/"


def read_input_file(from_file_path):
    result = ""
    with open(from_file_path, 'r', encoding='utf-8') as f:    
        result = f.read() 
    return result 

def write_into_file(to_file_path, s):
    with open(to_file_path, 'w', encoding='utf-8') as f:
        f.write(s)

def get_index(l):
    init = ""
    init_list = []
    result = [] # [(a,b)...]
    for i in range(0, len(l)):
        if l[i][0][0] != init:
            print(i, l[i])
            init_list.append(i)
            init = l[i][0][0]
    for i in range(0, len(init_list)-1):
        result.append((init_list[i],init_list[i+1]))
    result.append((init_list[-1],len(l)))
    return result

def index2str(l, var_name):
    '''
    l [(a,b)...]
    result windows.words_all_index = [...]
    '''
    result = ""
    for i in range(0,len(l)):
        result += '"%s":[%d, %d],\n' %(chr(i+97),l[i][0],l[i][1])
    result = var_name + '= {\n' + result
    result += '}'
    return result

def main(f_root, f_name, to_name, var_name):
    code = read_input_file(f_root + f_name)
    pos_fist_line = code.find("\n")
    code = "char_all = [" + code[pos_fist_line:]
    print(code[0:20])
    exec(code, locals(), globals()) 
    len(char_all)
    index = get_index(char_all)
    print(index)
    print(len(index))
    s = index2str(index, var_name)
    write_into_file(f_root + to_name, s)
    return True


if __name__ == "__main__":
    main(fr, "words.js", "words_index.js", "window.words_index_1dp")
    main(fr, "phrases.js", "phrases_index.js", "window.phrases_index_1dp")
    main(fr, "symbols.js", "symbols_index.js", "window.symbols_index_1dp")
    




