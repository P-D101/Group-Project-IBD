###### Copy is imported because we require deepcopying dictionaries 
import copy


###### Graph object to be used for manipulating programs
class Graph:
    def __init__(self, connections):
        self.out_set = self.out_edge_list(connections)
        self.in_set = self.in_edge_list(connections)
        ## Converting into a more efficient representation



###### Converting representation functions 

    def out_edge_list(self, connections):
        list = {}
        for connection in connections:
            if list.get(connection[0]) == None:
                list[connection[0]] = [connection[1]]
            else:
                list[connection[0]].append(connection[1])
        return list

    def in_edge_list(self, connections):
        list = {}
        for connection in connections:
            if list.get(connection[1]) == None:
                list[connection[1]] = [connection[0]]
            else:
                list[connection[1]].append(connection[0])
        return list

    def remove_edge(self, edge_start, edge_end):
        self.out_set[edge_start].remove(edge_end)
        self.in_set[edge_end].remove(edge_start)



###### DAG sort so that execution happens in the correct order

    def DAG_sort(self, start_nodes):
        out_set = copy.deepcopy(self.out_set)
        in_set = copy.deepcopy(self.in_set)
        sorted_order = []
        nodes = start_nodes.copy()
        while len(nodes) > 0:
            node = nodes.pop()
            sorted_order.append(node)
            try:
                for output_node in self.out_set[node].copy():
                    self.remove_edge(node, output_node)
                    if len(self.in_set[output_node]) == 0:
                        nodes.append(output_node)
            except:
                pass

        self.out_set = out_set
        self.in_set = in_set

        return sorted_order

    def DAG_sort_remove(self, start_nodes):
        connections = []
        sorted_order = []
        nodes = start_nodes.copy()
        while len(nodes) > 0:
            node = nodes.pop()
            sorted_order.append(node)
            try:
                for output_node in self.out_set[node].copy():
                    self.remove_edge(node, output_node)
                    connections.append([node, output_node])
                    if len(self.in_set[output_node]) == 0:
                        nodes.append(output_node)
            except:
                pass
            
        return connections















###### Test Execution

if __name__ == '__main__':
    connections = [
        [0, 2],
        [1, 2],
        [1, 3],
        [0, 3],
        [2, 4],
        [3, 5]
    ]

    graph = Graph(connections)

    print(graph.DAG_sort([0,1]))