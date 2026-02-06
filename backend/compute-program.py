def compute_program(JSON_program):
    pass

example_program = """
{
    "Policy Name" : "Example",
    "Data Sources" : ["Cloud_Serves_1", "Cloud_Serves_2"],
    "Nodes" : [
        {
            "Node Type" : "Input",
            "Node Position" : [100, 100],
            "Input Channel" : "Usage",
            "Input Provider" : "Cloud_Serves_1"
        }, {
            "Node Type" : "Input",
            "Node Position" : [100, 200],
            "Input Channel" : "Usage",
            "Input Provider" : "Cloud_Serves_2"
        }, {
            "Node Type" : "Greater Than",
            "Node Position" : [200, 100]
        }, {
            "Node Type" : "Greater Than",
            "Node Position" : [200, 200]
        }, {
            "Node Type" : "Ticket",
            "Node Position" : [300, 100],
            "Receiver" : "example.email@calero.com",
            "Description" : "example 1"
        }, {
            "Node Type" : "Ticket",
            "Node Position" : [300, 200],
            "Receiver" : "example.email@calero.com",
            "Description" : "example 2"
        }
    ],
    "Connections" : [
        [0, 2],
        [1, 2],
        [1, 3],
        [0, 3],
        [2, 4],
        [3, 5]
    ]
}
"""

Cloud_Serves_1_Usage = 0.5
Cloud_Serves_2_Usage = 0.1

if __name__ == '__main__':
    # Test Execution

    compute_program(example_program)